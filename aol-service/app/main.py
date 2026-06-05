"""FastAPI-Entry des AOL-Service."""
from __future__ import annotations

import logging
import os
import uuid
from typing import Any, Optional

import httpx
from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel

from .auth import require_bearer
from .graph import COMPILED

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("aol")

app = FastAPI(title="Produktintelligenz AOL", version="0.1.0")

LANGSMITH = os.environ.get("LANGSMITH_API_KEY")
if LANGSMITH:
    os.environ.setdefault("LANGCHAIN_TRACING_V2", "true")
    os.environ.setdefault("LANGCHAIN_PROJECT", "produktintelligenz-aol")
    os.environ.setdefault("LANGCHAIN_API_KEY", LANGSMITH)
    log.info("LangSmith-Tracing aktiv")

CALLBACK_URL = (os.environ.get("AOL_CALLBACK_URL") or "").rstrip("/")
CALLBACK_TOKEN = os.environ.get("AOL_CALLBACK_TOKEN") or ""


# ---------- Schemas ---------------------------------------------------------


class RunRequest(BaseModel):
    asset_id: str
    user_id: str
    project_id: Optional[str] = None
    run_id: Optional[str] = None
    retry: bool = False


class ConfirmRequest(BaseModel):
    review_case_id: str
    decision: str  # "confirm" | "reject"
    canonical_fact_id: Optional[str] = None
    user_id: str


# ---------- Callback --------------------------------------------------------


def _post_callback(payload: dict[str, Any]) -> None:
    """Schreibt Status zurück in Supabase (aol-callback Edge Function).

    Best-effort: Fehler werden nur geloggt, niemals geworfen — der Run-Erfolg
    hängt nicht am Callback.
    """
    if not CALLBACK_URL or not CALLBACK_TOKEN:
        log.warning("AOL_CALLBACK_URL/TOKEN fehlt — Callback übersprungen")
        return
    try:
        with httpx.Client(timeout=10.0) as c:
            r = c.post(
                CALLBACK_URL,
                json=payload,
                headers={"Authorization": f"Bearer {CALLBACK_TOKEN}"},
            )
            if r.status_code >= 300:
                log.error("Callback fehlgeschlagen %s: %s", r.status_code, r.text[:300])
    except Exception:
        log.exception("Callback-Request scheiterte")


# ---------- Routes ----------------------------------------------------------


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "aol",
        "graphiti_url": bool(os.environ.get("GRAPHITI_SERVICE_URL")),
        "callback_url": bool(CALLBACK_URL),
        "langsmith": bool(LANGSMITH),
    }


@app.post("/aol/run", dependencies=[Depends(require_bearer)])
def run(req: RunRequest) -> dict[str, Any]:
    thread_id = req.run_id or str(uuid.uuid4())
    log.info("AOL run start asset=%s thread=%s", req.asset_id, thread_id)

    # Sofort "running" zurückmelden, damit die UI den Status sieht.
    if req.run_id:
        _post_callback({"run_id": req.run_id, "status": "running", "current_node": "router"})

    initial = {
        "asset_id": req.asset_id,
        "user_id": req.user_id,
        "project_id": req.project_id,
        "run_id": thread_id,
        "retry": req.retry,
    }
    try:
        # TODO D2: durabler Aufruf mit Checkpointer + Tools.
        result = COMPILED.invoke(initial)
    except Exception as e:
        log.exception("AOL run failed")
        if req.run_id:
            _post_callback({
                "run_id": req.run_id,
                "status": "failed",
                "error": {"message": str(e), "where": "graph_invoke"},
            })
        raise HTTPException(status_code=500, detail=str(e))

    last_node = result.get("last_node")
    graph_context = result.get("graph_context") or ""

    if req.run_id:
        _post_callback({
            "run_id": req.run_id,
            "status": "running",
            "current_node": last_node,
            "metadata": {"graph_context_chars": len(graph_context)},
        })

    return {
        "ok": True,
        "thread_id": thread_id,
        "last_node": last_node,
        "graph_context": graph_context,
        "graph_context_chars": len(graph_context),
    }


@app.post("/aol/confirm", dependencies=[Depends(require_bearer)])
def confirm(req: ConfirmRequest) -> dict[str, Any]:
    # TODO D4: confirm_to_graph-Knoten triggern (Episode/Invalidation in Graphiti).
    log.info(
        "AOL confirm review_case=%s decision=%s fact=%s",
        req.review_case_id, req.decision, req.canonical_fact_id,
    )
    return {"ok": True, "queued": True}


@app.get("/aol/runs/{run_id}", dependencies=[Depends(require_bearer)])
def get_run(run_id: str) -> dict[str, Any]:
    # TODO D2: aus PostgresSaver / aol_runs lesen
    return {"ok": True, "run_id": run_id, "status": "stub"}
