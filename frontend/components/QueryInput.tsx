"use client"

import { FormEvent, useState } from "react"
import { Loader2, Search } from "lucide-react"
import { useAgentStream } from "@/hooks/useAgentStream"

export function QueryInput() {
  const [query, setQuery] = useState("")
  const { runResearch, pipelineStatus } = useAgentStream()
  const isRunning = pipelineStatus === "running"
  const canSubmit = query.trim().length >= 10 && query.length <= 500 && !isRunning

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    await runResearch(query.trim())
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 shadow-xl shadow-black/10">
      <textarea
        value={query}
        maxLength={500}
        rows={3}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Ask anything... e.g. 'Write a market analysis of EV batteries in India'"
        className="w-full resize-none rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      />
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>{isRunning ? "Agents are working - watch the trace below" : "Minimum 10 characters"}</span>
        <span>{query.length} / 500</span>
      </div>
      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            Research
          </>
        )}
      </button>
    </form>
  )
}
