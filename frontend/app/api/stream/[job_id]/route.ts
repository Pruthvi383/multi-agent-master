import { NextRequest } from "next/server"

type AgentName = "researcher" | "writer" | "critic" | "orchestrator" | "system"
type EventType =
  | "agent_start"
  | "agent_thinking"
  | "agent_done"
  | "orchestrator_decision"
  | "final_output"

interface DemoEvent {
  event_type: EventType
  agent: AgentName
  message: string
  data?: unknown
  timestamp: string
}

function makeEvent(
  event_type: EventType,
  agent: AgentName,
  message: string,
  data?: unknown
): DemoEvent {
  return {
    event_type,
    agent,
    message,
    data,
    timestamp: new Date().toISOString(),
  }
}

function reportFor(query: string) {
  const title = `Research Brief: ${query}`
  const sources = [
    "https://www.iea.org/",
    "https://www.worldbank.org/",
    "https://www.mckinsey.com/",
  ]
  const content = `# ${title}

## Summary

The topic **"${query}"** points to a fast-moving area where market structure, regulation, technology adoption, and capital availability all influence outcomes. A useful research view should separate short-term signals from durable trends, then compare those trends against credible sources and measurable indicators.

The strongest early conclusion is that organizations should treat this topic as both a strategic opportunity and an execution challenge. Winning approaches will combine timely research, clear prioritization, and repeated validation rather than one-time analysis.

## Main Findings

- Demand is likely to be shaped by cost, availability, policy support, and user trust.
- Competitive advantage will depend on speed of execution as much as access to information.
- Teams should monitor policy changes, funding flows, and adoption metrics before making large commitments.
- The best next step is to validate the thesis with current primary sources and expert interviews.

## Analysis

The opportunity around **"${query}"** should be evaluated across three dimensions. First, market timing matters: even strong ideas can underperform if infrastructure, regulation, or customer readiness is immature. Second, source quality matters: decisions should rely on recent primary data and transparent assumptions. Third, execution quality matters: the ability to iterate quickly often determines whether research turns into usable strategy.

The agent review scored this brief highly because it is structured, balanced, and action-oriented. A deeper production-grade report would add live citations, updated statistics, and a source-by-source confidence assessment.

## Conclusion

The practical recommendation is to continue with a focused research sprint: define the decision to be made, gather current evidence, compare three to five credible sources, and translate the findings into a concrete action plan.`

  return { title, sources, content }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  const { job_id } = await params
  const query = request.nextUrl.searchParams.get("query")?.trim() || "Multi-agent research system"
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      async function send(event: DemoEvent, delay = 450) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        await sleep(delay)
      }

      const report = reportFor(query)

      await send(
        makeEvent(
          "orchestrator_decision",
          "orchestrator",
          `Starting research job ${job_id.slice(0, 8)}...`
        )
      )
      await send(makeEvent("agent_start", "researcher", "Researcher agent started."))
      await send(makeEvent("agent_thinking", "researcher", `Searching for: ${query}`))
      await send(
        makeEvent("agent_done", "researcher", "Research complete with 4 key findings.", {
          sources: report.sources,
        })
      )
      await send(
        makeEvent("orchestrator_decision", "orchestrator", "Writing draft (iteration 1)...")
      )
      await send(makeEvent("agent_start", "writer", "Writer agent started."))
      await send(makeEvent("agent_thinking", "writer", "Writing report draft..."))
      await send(
        makeEvent("agent_done", "writer", `Draft complete: ${report.title} (360 words).`)
      )
      await send(makeEvent("agent_start", "critic", "Critic agent started."))
      await send(makeEvent("agent_thinking", "critic", `Reviewing draft: '${report.title}'...`))
      await send(makeEvent("agent_done", "critic", "Critique complete: 8/10, approved=true."))
      await send(
        makeEvent("orchestrator_decision", "orchestrator", "Report approved. Finalizing output.")
      )
      await send(
        makeEvent("final_output", "system", "Research report complete.", {
          content: report.content,
          title: report.title,
          sources: report.sources,
          score: 8,
          iterations: 1,
        }),
        0
      )

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
