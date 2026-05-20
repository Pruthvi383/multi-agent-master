"use client"

import clsx from "clsx"
import { Check } from "lucide-react"
import { AgentStatus } from "@/types/agent"

interface AgentCardProps {
  name: string
  status: AgentStatus
  messages: string[]
  label: string
  icon: string
}

const borderByAgent: Record<string, string> = {
  researcher: "border-l-teal-500",
  writer: "border-l-indigo-500",
  critic: "border-l-amber-500",
  orchestrator: "border-l-gray-500",
}

const badgeByStatus: Record<AgentStatus, string> = {
  idle: "bg-gray-800 text-gray-400",
  thinking: "bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20",
  done: "bg-green-500/10 text-green-300 ring-1 ring-green-500/20",
  error: "bg-red-500/10 text-red-300 ring-1 ring-red-500/20",
}

export function AgentCard({ name, status, messages, label, icon }: AgentCardProps) {
  return (
    <div className={clsx("min-h-36 rounded-lg border border-l-4 border-gray-800 bg-gray-900 p-4", borderByAgent[name])}>
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-gray-950 text-base">{icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-100">{label}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", badgeByStatus[status])}>
              {status}
            </span>
            {status === "thinking" && (
              <span className="flex items-center gap-1" aria-label="thinking">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-300" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-300 delay-150" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-300 delay-300" />
              </span>
            )}
            {status === "done" && <Check className="h-4 w-4 text-green-300" />}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {messages.slice(-3).map((message, index) => (
          <p key={`${message}-${index}`} className="line-clamp-2 text-xs leading-5 text-gray-500">
            {message}
          </p>
        ))}
        {messages.length === 0 && <p className="text-xs text-gray-600">Waiting for work.</p>}
      </div>
    </div>
  )
}
