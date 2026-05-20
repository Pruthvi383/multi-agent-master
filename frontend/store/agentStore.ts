import { create } from "zustand"
import {
  AgentCardState,
  AgentEvent,
  AgentName,
  FinalOutputData,
  PipelineStatus,
} from "@/types/agent"

interface AgentStore {
  jobId: string | null
  pipelineStatus: PipelineStatus
  events: AgentEvent[]
  agents: Record<string, AgentCardState>
  finalOutput: FinalOutputData | null
  error: string | null
  startJob: (jobId: string) => void
  addEvent: (event: AgentEvent) => void
  setFinalOutput: (data: FinalOutputData) => void
  setError: (msg: string) => void
  reset: () => void
}

const agentNames: AgentName[] = ["researcher", "writer", "critic", "orchestrator"]

function initialAgents(): Record<string, AgentCardState> {
  return Object.fromEntries(
    agentNames.map((name) => [name, { name, status: "idle", messages: [] }])
  )
}

export const useAgentStore = create<AgentStore>((set) => ({
  jobId: null,
  pipelineStatus: "idle",
  events: [],
  agents: initialAgents(),
  finalOutput: null,
  error: null,

  startJob: (jobId) =>
    set({
      jobId,
      pipelineStatus: "running",
      error: null,
    }),

  addEvent: (event) =>
    set((state) => {
      const nextAgents = { ...state.agents }
      const agentKey = event.agent === "system" ? "orchestrator" : event.agent
      const current =
        nextAgents[agentKey] ?? ({ name: agentKey as AgentName, status: "idle", messages: [] })

      const messages = [...current.messages, event.message]
      let status = current.status

      if (event.event_type === "agent_start") status = "thinking"
      if (event.event_type === "agent_done") status = "done"
      if (event.event_type === "error") status = "error"
      if (event.event_type === "orchestrator_decision") status = "thinking"

      nextAgents[agentKey] = {
        ...current,
        status,
        messages,
      }

      const isFinal = event.event_type === "final_output"
      const isError = event.event_type === "error"

      return {
        events: [...state.events, event],
        agents: nextAgents,
        finalOutput: isFinal ? (event.data as unknown as FinalOutputData) : state.finalOutput,
        pipelineStatus: isFinal ? "completed" : isError ? "failed" : state.pipelineStatus,
        error: isError ? event.message : state.error,
      }
    }),

  setFinalOutput: (data) =>
    set({
      finalOutput: data,
      pipelineStatus: "completed",
    }),

  setError: (msg) =>
    set({
      error: msg,
      pipelineStatus: "failed",
    }),

  reset: () =>
    set({
      jobId: null,
      pipelineStatus: "idle",
      events: [],
      agents: initialAgents(),
      finalOutput: null,
      error: null,
    }),
}))
