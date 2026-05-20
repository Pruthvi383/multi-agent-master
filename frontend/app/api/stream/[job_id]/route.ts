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
    "https://www.anthropic.com/news/claude-3-5-haiku",
    "https://docs.tavily.com",
    "https://langchain-ai.github.io/langgraph/",
  ]
  const content = `# ${title}

## Summary

This deployed Vercel demo shows the full multi-agent research interface working from a single public link. The production frontend now streams server-sent events from same-origin Next.js API routes, so it no longer tries to call localhost from the browser.

For the query **"${query}"**, the Researcher, Writer, and Critic agents demonstrate the same orchestration flow used by the FastAPI/LangGraph backend scaffold in this repository. The backend implementation is ready for real Claude + Tavily execution once it is deployed with API keys and Redis.

## Main Findings

- The user experience now supports live agent status updates over SSE.
- The repository includes a production FastAPI backend with LangGraph orchestration.
- The Writer and Critic revision loop is implemented in the backend and capped at three iterations.
- The frontend renders markdown reports, sources, quality score, and iteration metadata.

## Analysis

The most important production fix was replacing browser calls to \`http://localhost:8000\` with same-origin API routes for the Vercel deployment. Public browsers cannot access a developer machine's local backend, so the app needs either a deployed backend URL in \`NEXT_PUBLIC_API_URL\` or API routes hosted with the frontend.

## Conclusion

The public link is now usable as a working demo. To make it run real AI research instead of demo streaming, deploy the FastAPI backend to Railway, Render, or Fly.io, configure Redis plus \`ANTHROPIC_API_KEY\` and \`TAVILY_API_KEY\`, then set \`NEXT_PUBLIC_API_URL\` in Vercel to that backend URL.`

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
