"use client"

import { AgentTrace } from "@/components/AgentTrace"
import { QueryInput } from "@/components/QueryInput"
import { ReportOutput } from "@/components/ReportOutput"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            M
          </div>
          <h1 className="text-lg font-semibold">MultiAgent Research</h1>
          <span className="ml-auto text-xs text-gray-500">Researcher · Writer · Critic</span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <QueryInput />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-400">Agent Trace</h2>
            <AgentTrace />
          </div>
          <div>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-400">Research Report</h2>
            <ReportOutput />
          </div>
        </div>
      </div>
    </main>
  )
}
