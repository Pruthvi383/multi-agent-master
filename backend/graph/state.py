from typing import Any, List, Literal, Optional, TypedDict
from pydantic import BaseModel
from datetime import datetime


class ResearchFindings(BaseModel):
    summary: str
    key_facts: List[str]
    sources: List[str]
    confidence: float


class WriterDraft(BaseModel):
    title: str
    content: str
    word_count: int
    sections: List[str]


class CritiqueResult(BaseModel):
    score: int
    strengths: List[str]
    issues: List[str]
    suggestions: List[str]
    approved: bool


class AgentEvent(BaseModel):
    """Streamed to the frontend via SSE."""

    event_type: Literal[
        "agent_start",
        "agent_thinking",
        "agent_done",
        "orchestrator_decision",
        "final_output",
        "error",
    ]
    agent: Literal["researcher", "writer", "critic", "orchestrator", "system"]
    message: str
    data: Optional[Any] = None
    timestamp: str = ""

    def __init__(self, **data):
        if not data.get("timestamp"):
            data["timestamp"] = datetime.utcnow().isoformat()
        super().__init__(**data)


class AgentState(TypedDict):
    query: str
    job_id: str
    research: Optional[ResearchFindings]
    draft: Optional[WriterDraft]
    critique: Optional[CritiqueResult]
    final_output: Optional[str]
    iteration_count: int
    max_iterations: int
    current_agent: str
    status: Literal["running", "completed", "failed"]
    events: List[AgentEvent]
    error: Optional[str]
