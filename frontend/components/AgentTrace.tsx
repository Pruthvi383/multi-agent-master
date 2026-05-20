"use client"

import clsx from "clsx"
import { useAgentStore } from "@/store/agentStore"
import { AgentCard } from "./AgentCard"

const agentMeta = {
  researcher: { label: "Researcher", icon: "R" },
  writer: { label: "Writer", icon: "W" },
  critic: { label: "Critic", icon: "C" },
  orchestrator: { label: "Orchestrator", icon: "O" },
}

const eventColor: Record<string, string> = {
  researcher: "text-teal-300",
  writer: "text-indigo-300",
  critic: "text-amber-300",
  orchestrator: "text-gray-300",
  system: "text-gray-300",
}

export function AgentTrace() {
  const { agents, pipelineStatus, events } = useAgentStore()

  if (pipelineStatus === "idle") {
    return (
      <div className="rounded-lg border border-dashed border-gray-800 bg-gray-900/60 p-8 text-center text-sm text-gray-500">
        Run a query to watch the agents work
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Object.entries(agentMeta).map(([name, meta]) => (
          <AgentCard
            key={name}
            name={name}
            label={meta.label}
            icon={meta.icon}
            status={agents[name]?.status ?? "idle"}
            messages={agents[name]?.messages ?? []}
          />
        ))}
      </div>
      <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-800 bg-gray-900 p-4">
        <div className="space-y-3">
          {events.slice(-8).map((event, index) => (
            <div key={`${event.timestamp}-${index}`} className="grid grid-cols-[72px_96px_1fr] gap-2 text-xs leading-5">
              <span className="text-gray-600">
                {new Date(event.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span className={clsx("font-medium capitalize", eventColor[event.agent])}>{event.agent}</span>
              <span className="text-gray-400">{event.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
