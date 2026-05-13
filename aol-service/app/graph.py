"""LangGraph-Definition des AOL.

Skelett — Knoten sind Stubs. In D2 wird der Minimal-Pfad
(router → context_loader → interpreter → condenser) live geschaltet, in D3
folgen linker, delta_classifier, gap_detector, dependency_detector,
conflict_detector, case_builder.
"""
from __future__ import annotations

import logging
from typing import Any

from langgraph.graph import END, START, StateGraph

from .state import AolState

log = logging.getLogger("aol.graph")

# ---------- Knoten ----------------------------------------------------------


def n_router(state: AolState) -> dict[str, Any]:
    log.info("router: asset=%s project=%s", state.get("asset_id"), state.get("project_id"))
    return {"last_node": "router"}


def n_context_loader(state: AolState) -> dict[str, Any]:
    # TODO D2: Graphiti.search + getMemory für project_id, gefilterte Snapshot
    return {"last_node": "context_loader", "graph_context": {}}


def n_interpreter(state: AolState) -> dict[str, Any]:
    # TODO D2: Lovable AI / Gemini extrahiert candidates aus state["text"]
    return {"last_node": "interpreter", "candidates": []}


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
    # TODO D2: schreibt proposed_facts + dialog_session + review_cases + aol_runs.completed
    return {"last_node": "condenser", "facts_written": 0}


# ---------- Graph -----------------------------------------------------------


def build_graph():
    g = StateGraph(AolState)
    g.add_node("router", n_router)
    g.add_node("context_loader", n_context_loader)
    g.add_node("interpreter", n_interpreter)
    g.add_node("linker", n_linker)
    g.add_node("delta_classifier", n_delta_classifier)
    g.add_node("gap_detector", n_gap_detector)
    g.add_node("dependency_detector", n_dependency_detector)
    g.add_node("conflict_detector", n_conflict_detector)
    g.add_node("case_builder", n_case_builder)
    g.add_node("condenser", n_condenser)

    g.add_edge(START, "router")
    g.add_edge("router", "context_loader")
    g.add_edge("context_loader", "interpreter")
    g.add_edge("interpreter", "linker")
    g.add_edge("linker", "delta_classifier")
    g.add_edge("delta_classifier", "gap_detector")
    g.add_edge("gap_detector", "dependency_detector")
    g.add_edge("dependency_detector", "conflict_detector")
    g.add_edge("conflict_detector", "case_builder")
    g.add_edge("case_builder", "condenser")
    g.add_edge("condenser", END)

    # TODO D2: PostgresSaver(conn_string=DATABASE_URL) als checkpointer.
    # Für jetzt In-Memory-Compile, damit der Service ohne DATABASE_URL startet.
    return g.compile()


COMPILED = build_graph()
