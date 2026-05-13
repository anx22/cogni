"""LangGraph-Definition des AOL — Welle A.

Welle A = Enrichment-Schicht:
  router → context_loader (Graphiti) → condenser (no-op) → END.

Wichtig: Der Railway-Service bekommt keinen Datenbank-/Service-Role-Key und ruft
keine Lovable-Cloud-Funktion mit Admin-Rechten. Er liefert nur Graph-Kontext an
`intake-trigger` zurück; `intake-understand` läuft anschließend innerhalb
Lovable Cloud mit den dort intern verfügbaren Secrets.

Welle B (linker, conflict, gap, dependency, case_builder) bleibt vorerst Stub
und wird erst aktiviert, wenn Welle A produktiv stabile Daten in Graphiti
abgelegt hat.
"""
from __future__ import annotations

import logging
import os
from typing import Any

import httpx
from langgraph.graph import END, START, StateGraph

from .state import AolState

log = logging.getLogger("aol.graph")

GRAPHITI_URL = (os.environ.get("GRAPHITI_SERVICE_URL") or "").strip().rstrip("/")
if GRAPHITI_URL and not GRAPHITI_URL.startswith(("http://", "https://")):
    GRAPHITI_URL = f"https://{GRAPHITI_URL}"
GRAPHITI_TOKEN = os.environ.get("GRAPHITI_SERVICE_TOKEN") or ""


# ---------- Knoten ----------------------------------------------------------


def n_router(state: AolState) -> dict[str, Any]:
    log.info("router: asset=%s project=%s", state.get("asset_id"), state.get("project_id"))
    return {"last_node": "router"}


def _format_graph_context(payload: Any) -> str:
    """Macht aus der Graphiti-Antwort einen kompakten Prompt-Text."""
    if not payload:
        return ""
    facts = []
    if isinstance(payload, dict):
        # /get-memory liefert {"facts": [...]} oder {"messages": [...]}
        for key in ("facts", "memory", "messages"):
            v = payload.get(key)
            if isinstance(v, list):
                facts.extend(v)
        # /search liefert ggf. {"facts":[...]} direkt
    elif isinstance(payload, list):
        facts = payload

    lines: list[str] = []
    for f in facts[:20]:
        if isinstance(f, dict):
            txt = (
                f.get("fact")
                or f.get("content")
                or f.get("name")
                or f.get("summary")
                or ""
            )
            if isinstance(txt, str) and txt.strip():
                lines.append(f"- {txt.strip()[:240]}")
    return "\n".join(lines)


def n_context_loader(state: AolState) -> dict[str, Any]:
    """Holt vorhandenes Wissen aus dem Projekt-Graph. Niemals werfen."""
    project_id = state.get("project_id")
    if not project_id or not GRAPHITI_URL:
        log.info("context_loader: skip (project_id=%s graphiti=%s)", bool(project_id), bool(GRAPHITI_URL))
        return {"last_node": "context_loader", "graph_context": ""}

    headers = {"Content-Type": "application/json"}
    if GRAPHITI_TOKEN:
        headers["Authorization"] = f"Bearer {GRAPHITI_TOKEN}"

    # Graphiti /get-memory verlangt center_node_uuid als Pflichtfeld (auch wenn null).
    # Ohne dieses Feld antwortet Graphiti 422 — kein Kontext, keine Anreicherung.
    body = {
        "group_id": str(project_id),
        "max_facts": 20,
        "center_node_uuid": None,
        "messages": [],
    }
    try:
        with httpx.Client(timeout=15.0) as c:
            r = c.post(f"{GRAPHITI_URL}/get-memory", json=body, headers=headers)
            if r.status_code >= 300:
                log.warning("graphiti get-memory %s: %s", r.status_code, r.text[:200])
                return {"last_node": "context_loader", "graph_context": ""}
            data = r.json()
    except Exception as e:
        log.exception("context_loader: graphiti call failed")
        return {"last_node": "context_loader", "graph_context": "", "error": str(e)}

    ctx = _format_graph_context(data)
    log.info("context_loader: %d chars Kontext", len(ctx))
    return {"last_node": "context_loader", "graph_context": ctx}


# ---------- Welle B — Stubs ------------------------------------------------


def n_linker(state: AolState) -> dict[str, Any]:
    return {"last_node": "linker"}


def n_delta_classifier(state: AolState) -> dict[str, Any]:
    return {"last_node": "delta_classifier", "deltas": []}


def n_gap_detector(state: AolState) -> dict[str, Any]:
    return {"last_node": "gap_detector", "gaps": []}


def n_dependency_detector(state: AolState) -> dict[str, Any]:
    return {"last_node": "dependency_detector", "dependencies": []}


def n_conflict_detector(state: AolState) -> dict[str, Any]:
    return {"last_node": "conflict_detector", "conflicts": []}


def n_case_builder(state: AolState) -> dict[str, Any]:
    return {"last_node": "case_builder", "cases": []}


def n_condenser(state: AolState) -> dict[str, Any]:
    # Welle A: no-op. Schreiben passiert danach in Lovable Cloud / intake-understand.
    # Welle B: hier conflict/gap/dependency-Detection + Aggregat-Schreiben.
    return {
        "last_node": "condenser",
        "graph_context": state.get("graph_context") or "",
    }


# ---------- Graph -----------------------------------------------------------


def build_graph():
    g = StateGraph(AolState)
    g.add_node("router", n_router)
    g.add_node("context_loader", n_context_loader)
    g.add_node("condenser", n_condenser)

    g.add_edge(START, "router")
    g.add_edge("router", "context_loader")
    g.add_edge("context_loader", "condenser")
    g.add_edge("condenser", END)

    # Welle B: linker/delta/gap/dependency/conflict/case_builder werden später
    # nach dem context_loader eingefügt, aber DB-Schreiben bleibt Cloud-seitig.
    return g.compile()


COMPILED = build_graph()
