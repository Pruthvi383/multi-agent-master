"use client"

import { useCallback, useRef } from "react"
import { useAgentStore } from "@/store/agentStore"
import { AgentEvent } from "@/types/agent"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function useAgentStream() {
  const eventSourceRef = useRef<EventSource | null>(null)
  const { startJob, addEvent, setError, reset, pipelineStatus } = useAgentStore()

  const runResearch = useCallback(
    async (query: string) => {
      eventSourceRef.current?.close()
      reset()

      try {
        const response = await fetch(`${API_BASE}/api/research`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        })

        if (!response.ok) {
          const detail = await response.text()
          throw new Error(detail || "Failed to start research job")
        }

        const { job_id } = (await response.json()) as { job_id: string; status: string }
        startJob(job_id)

        const eventSource = new EventSource(`${API_BASE}/api/stream/${job_id}`)
        eventSourceRef.current = eventSource

        eventSource.onmessage = (event) => {
          try {
            const parsed: AgentEvent = JSON.parse(event.data)
            addEvent(parsed)
            if (parsed.event_type === "final_output" || parsed.event_type === "error") {
              eventSource.close()
              eventSourceRef.current = null
            }
          } catch {
            setError("Could not parse stream event")
            eventSource.close()
            eventSourceRef.current = null
          }
        }

        eventSource.onerror = () => {
          setError("Connection lost")
          eventSource.close()
          eventSourceRef.current = null
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to start research")
      }
    },
    [startJob, addEvent, setError, reset]
  )

  const cancel = useCallback(() => {
    eventSourceRef.current?.close()
    eventSourceRef.current = null
  }, [])

  return { runResearch, cancel, pipelineStatus }
}
