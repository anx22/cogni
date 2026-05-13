"""AOL-State — wandert von Knoten zu Knoten im LangGraph."""
from typing import Any, Optional, TypedDict


class AolState(TypedDict, total=False):
    # Eingabe
    asset_id: str
    user_id: str
    project_id: Optional[str]
    run_id: str
    retry: bool

    # Roh-Material
    text: str
    source_id: Optional[str]
    parsed_document_id: Optional[str]

    # Graphiti-Kontext (vom context_loader gefüllt)
    graph_context: dict[str, Any]

    # Vom interpreter erkannte Kandidaten
    candidates: list[dict[str, Any]]

    # delta_classifier Ergebnisse
    deltas: list[dict[str, Any]]

    # gap_detector
    gaps: list[dict[str, Any]]

    # dependency_detector
    dependencies: list[dict[str, Any]]

    # conflict_detector
    conflicts: list[dict[str, Any]]

    # case_builder Ergebnisse → werden im condenser geschrieben
    cases: list[dict[str, Any]]

    # Output
    session_id: Optional[str]
    facts_written: int

    # Tracing / Errors
    last_node: Optional[str]
    error: Optional[str]
