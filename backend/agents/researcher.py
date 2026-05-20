from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_community.tools import TavilySearchResults
from langgraph.prebuilt import create_react_agent

from graph.state import AgentEvent, ResearchFindings


class ResearcherAgent:
    def __init__(self):
        self.llm = ChatAnthropic(model="claude-3-5-haiku-20241022", temperature=0)
        self.search = TavilySearchResults(max_results=5)
        self.agent = create_react_agent(self.llm, [self.search])
        self.structured_llm = self.llm.with_structured_output(ResearchFindings)

    async def run(self, query: str, emit_fn) -> ResearchFindings:
        try:
            await emit_fn(
                AgentEvent(
                    event_type="agent_start",
                    agent="researcher",
                    message="Researcher agent started.",
                )
            )
            await emit_fn(
                AgentEvent(
                    event_type="agent_thinking",
                    agent="researcher",
                    message=f"Searching the web for: {query}",
                )
            )

            system_prompt = (
                "You are a world-class research analyst. Search the web thoroughly "
                "for information about the given topic. Gather facts, statistics, "
                "and credible sources. Be comprehensive but accurate."
            )
            agent_result = await self.agent.ainvoke(
                {
                    "messages": [
                        SystemMessage(content=system_prompt),
                        HumanMessage(content=query),
                    ]
                }
            )
            messages = agent_result.get("messages", [])
            raw_research = messages[-1].content if messages else ""

            findings = await self.structured_llm.ainvoke(
                [
                    SystemMessage(
                        content=(
                            "Convert the research notes into the requested structured "
                            "schema. Keep sources as exact URLs when available."
                        )
                    ),
                    HumanMessage(
                        content=f"Original query: {query}\n\nResearch notes:\n{raw_research}"
                    ),
                ]
            )

            await emit_fn(
                AgentEvent(
                    event_type="agent_done",
                    agent="researcher",
                    message=f"Research complete with {len(findings.key_facts)} key facts.",
                    data=findings.model_dump(),
                )
            )
            return findings
        except Exception as exc:
            await emit_fn(
                AgentEvent(
                    event_type="error",
                    agent="researcher",
                    message=f"Researcher failed: {exc}",
                )
            )
            raise
