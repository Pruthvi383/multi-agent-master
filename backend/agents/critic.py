from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

from graph.state import AgentEvent, CritiqueResult, WriterDraft


class CriticAgent:
    def __init__(self):
        self.llm = ChatAnthropic(model="claude-3-5-haiku-20241022", temperature=0)
        self.structured_llm = self.llm.with_structured_output(CritiqueResult)

    async def run(self, query: str, draft: WriterDraft, emit_fn) -> CritiqueResult:
        try:
            await emit_fn(
                AgentEvent(
                    event_type="agent_start",
                    agent="critic",
                    message="Critic agent started.",
                )
            )
            await emit_fn(
                AgentEvent(
                    event_type="agent_thinking",
                    agent="critic",
                    message=f"Reviewing draft: '{draft.title}'...",
                )
            )

            system_prompt = (
                "You are a rigorous editor and fact-checker. Evaluate the given report "
                "on these criteria: accuracy, completeness, clarity, structure, source quality. "
                "Score 1-10. Approve (approved=True) only if score >= 7. "
                "Be specific in your issues and suggestions."
            )
            user_prompt = (
                f"Original query:\n{query}\n\n"
                f"Draft title:\n{draft.title}\n\n"
                f"Draft content:\n{draft.content}"
            )
            critique = await self.structured_llm.ainvoke(
                [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]
            )
            await emit_fn(
                AgentEvent(
                    event_type="agent_done",
                    agent="critic",
                    message=f"Critique complete: {critique.score}/10, approved={critique.approved}.",
                    data=critique.model_dump(),
                )
            )
            return critique
        except Exception as exc:
            await emit_fn(
                AgentEvent(
                    event_type="error",
                    agent="critic",
                    message=f"Critic failed: {exc}",
                )
            )
            raise
