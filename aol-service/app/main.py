"""FastAPI-Entry des AOL-Service."""
from __future__ import annotations

import logging
import os
import uuid
from typing import Any, Optional

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


# ---------- Routes ----------------------------------------------------------


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "aol",
        "graphiti_url": bool(os.environ.get("GRAPHITI_SERVICE_URL")),
        "supabase_url": bool(os.environ.get("SUPABASE_URL")),
        "langsmith": bool(LANGSMITH),
    }


@app.post("/aol/run", dependencies=[Depends(require_bearer)])
def run(req: RunRequest) -> dict[str, Any]:
    thread_id = req.run_id or str(uuid.uuid4())
    log.info("AOL run start asset=%s thread=%s", req.asset_id, thread_id)

    initial = {
        "asset_id": req.asset_id,
        "user_id": req.user_id,
        "project_id": req.project_id,
        "run_id": thread_id,
        "retry": req.retry,
    }
    try:
        # TODO D2: durabler Aufruf mit Checkpointer + Tools.
        # Für das Skelett synchroner Lauf der Stub-Knoten.
        result = COMPILED.invoke(initial)
    except Exception as e:
        log.exception("AOL run failed")
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "ok": True,
        "thread_id": thread_id,
        "last_node": result.get("last_node"),
        "facts_written": result.get("facts_written", 0),
        "session_id": result.get("session_id"),
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
