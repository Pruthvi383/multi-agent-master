export type AgentName = "researcher" | "writer" | "critic" | "orchestrator" | "system"

export type EventType =
  | "agent_start"
  | "agent_thinking"
  | "agent_done"
  | "orchestrator_decision"
  | "final_output"
  | "error"

export interface AgentEvent {
  event_type: EventType
  agent: AgentName
  message: string
  data?: Record<string, unknown> | null
  timestamp: string
}

export interface FinalOutputData {
  content: string
  title: string
  sources: string[]
  score: number
  iterations: number
}

export type AgentStatus = "idle" | "thinking" | "done" | "error"

export interface AgentCardState {
  name: AgentName
  status: AgentStatus
  messages: string[]
  result?: string
}

export type PipelineStatus = "idle" | "running" | "completed" | "failed"
