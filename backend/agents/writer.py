from typing import Optional

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

from graph.state import AgentEvent, CritiqueResult, ResearchFindings, WriterDraft


class WriterAgent:
    def __init__(self):
        self.llm = ChatAnthropic(model="claude-3-5-haiku-20241022", temperature=0.2)
        self.structured_llm = self.llm.with_structured_output(WriterDraft)

    async def run(
        self,
        query: str,
        research: ResearchFindings,
        previous_critique: Optional[CritiqueResult],
        emit_fn,
    ) -> WriterDraft:
        try:
            await emit_fn(
                AgentEvent(
                    event_type="agent_start",
                    agent="writer",
                    message="Writer agent started.",
                )
            )

            facts = "\n".join(f"- {fact}" for fact in research.key_facts)
            sources = "\n".join(f"- {source}" for source in research.sources)
            critique_text = ""
            if previous_critique:
                issues = "\n".join(f"- {issue}" for issue in previous_critique.issues)
                suggestions = "\n".join(
                    f"- {suggestion}" for suggestion in previous_critique.suggestions
                )
                critique_text = (
                    "\n\nPREVIOUS CRITIQUE (you MUST address these issues):\n"
                    f"Issues:\n{issues}\n\nSuggestions:\n{suggestions}"
                )

            user_prompt = (
                f"Original query:\n{query}\n\n"
                f"Research summary:\n{research.summary}\n\n"
                f"Key facts:\n{facts}\n\n"
                f"Sources:\n{sources}"
                f"{critique_text}"
            )
            system_prompt = (
                "You are an expert technical writer and analyst. Write a comprehensive, "
                "well-structured markdown report. Use proper headings (##), bullet points, "
                "bold for key terms. Include a summary, main findings, analysis, and conclusion. "
                "Always cite your sources inline as [Source](url). Minimum 400 words."
            )

            await emit_fn(
                AgentEvent(
                    event_type="agent_thinking",
                    agent="writer",
                    message="Writing report draft...",
                )
            )

            draft = await self.structured_llm.ainvoke(
                [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]
            )
            await emit_fn(
                AgentEvent(
                    event_type="agent_done",
                    agent="writer",
                    message=f"Draft complete: {draft.title} ({draft.word_count} words).",
                    data=draft.model_dump(),
                )
            )
            return draft
        except Exception as exc:
            await emit_fn(
                AgentEvent(
                    event_type="error",
                    agent="writer",
                    message=f"Writer failed: {exc}",
                )
            )
            raise
