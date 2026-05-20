"""
orchestrator.py — LangGraph StateGraph that coordinates the 3 agents.

Graph flow:
    START → researcher_node → writer_node → critic_node
                                    ↑              |
                                    |    (if not approved AND iterations < max)
                                    └──────────────┘
                                           |
                                    (if approved OR max iterations reached)
                                           ↓
                                    finalize_node → END
"""

from typing import Awaitable, Callable
from langgraph.graph import END, START, StateGraph

from agents.critic import CriticAgent
from agents.researcher import ResearcherAgent
from agents.writer import WriterAgent
from graph.state import AgentEvent, AgentState


def build_graph(emit_fn: Callable[[AgentEvent], Awaitable[None]]) -> StateGraph:
    """
    Build and compile the LangGraph StateGraph.
    emit_fn is passed into each node so agents can stream events.
    Returns a compiled graph ready to call with ainvoke().
    """

    researcher = ResearcherAgent()
    writer = WriterAgent()
    critic = CriticAgent()

    async def researcher_node(state: AgentState) -> dict:
        """Run the Researcher agent. Update state with research findings."""
        await emit_fn(
            AgentEvent(
                event_type="orchestrator_decision",
                agent="orchestrator",
                message="Starting research phase...",
            )
        )
        research = await researcher.run(state["query"], emit_fn)
        return {"research": research, "current_agent": "writer"}

    async def writer_node(state: AgentState) -> dict:
        """Run the Writer agent. Uses research + optional previous critique."""
        await emit_fn(
            AgentEvent(
                event_type="orchestrator_decision",
                agent="orchestrator",
                message=f"Writing draft (iteration {state['iteration_count'] + 1})...",
            )
        )
        draft = await writer.run(
            query=state["query"],
            research=state["research"],
            previous_critique=state.get("critique"),
            emit_fn=emit_fn,
        )
        return {
            "draft": draft,
            "current_agent": "critic",
            "iteration_count": state["iteration_count"] + 1,
        }

    async def critic_node(state: AgentState) -> dict:
        """Run the Critic agent. Scores the draft and decides approval."""
        critique = await critic.run(
            query=state["query"],
            draft=state["draft"],
            emit_fn=emit_fn,
        )
        return {
            "critique": critique,
            "current_agent": "writer" if not critique.approved else "finalize",
        }

    async def finalize_node(state: AgentState) -> dict:
        """Package the final approved draft as the output."""
        await emit_fn(
            AgentEvent(
                event_type="orchestrator_decision",
                agent="orchestrator",
                message="Report approved. Finalizing output...",
            )
        )
        final = state["draft"].content
        await emit_fn(
            AgentEvent(
                event_type="final_output",
                agent="system",
                message="Research report complete.",
                data={
                    "content": final,
                    "title": state["draft"].title,
                    "sources": state["research"].sources,
                    "score": state["critique"].score,
                    "iterations": state["iteration_count"],
                },
            )
        )
        return {"final_output": final, "status": "completed"}

    def should_revise(state: AgentState) -> str:
        """
        After the Critic runs:
        - If approved → go to finalize
        - If not approved AND under max_iterations → go back to writer
        - If not approved AND at max_iterations → finalize anyway (best effort)
        """
        critique = state["critique"]
        iterations = state["iteration_count"]
        max_iter = state["max_iterations"]

        if critique.approved:
            return "finalize"
        if iterations < max_iter:
            return "writer"
        return "finalize"

    graph = StateGraph(AgentState)

    graph.add_node("researcher", researcher_node)
    graph.add_node("writer", writer_node)
    graph.add_node("critic", critic_node)
    graph.add_node("finalize", finalize_node)

    graph.add_edge(START, "researcher")
    graph.add_edge("researcher", "writer")
    graph.add_edge("writer", "critic")
    graph.add_conditional_edges(
        "critic", should_revise, {"writer": "writer", "finalize": "finalize"}
    )
    graph.add_edge("finalize", END)

    return graph.compile()


async def run_pipeline(query: str, job_id: str, emit_fn) -> AgentState:
    """
    Entry point called by the API route.
    Initializes state and runs the compiled graph.
    """
    initial_state: AgentState = {
        "query": query,
        "job_id": job_id,
        "research": None,
        "draft": None,
        "critique": None,
        "final_output": None,
        "iteration_count": 0,
        "max_iterations": 3,
        "current_agent": "researcher",
        "status": "running",
        "events": [],
        "error": None,
    }

    graph = build_graph(emit_fn)

    try:
        final_state = await graph.ainvoke(initial_state)
        return final_state
    except Exception as e:
        await emit_fn(
            AgentEvent(
                event_type="error",
                agent="system",
                message=f"Pipeline failed: {str(e)}",
            )
        )
        raise
