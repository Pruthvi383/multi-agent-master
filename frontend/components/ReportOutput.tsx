"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Clipboard, Check } from "lucide-react"
import { useAgentStore } from "@/store/agentStore"

export function ReportOutput() {
  const { finalOutput, pipelineStatus, error } = useAgentStore()
  const [copied, setCopied] = useState(false)

  async function copyReport() {
    if (!finalOutput?.content) return
    await navigator.clipboard.writeText(finalOutput.content)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  if (pipelineStatus === "failed") {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-950/30 p-6 text-sm text-red-200">
        {error ?? "Something went wrong while running the research pipeline."}
      </div>
    )
  }

  if (pipelineStatus === "running") {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
        <div className="space-y-4">
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-800" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-800" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-800" />
        </div>
      </div>
    )
  }

  if (pipelineStatus !== "completed" || !finalOutput) {
    return (
      <div className="rounded-lg border border-dashed border-gray-800 bg-gray-900/60 p-8 text-center text-sm text-gray-500">
        Your research report will appear here
      </div>
    )
  }

  return (
    <article className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-50">{finalOutput.title}</h1>
          <p className="mt-2 text-xs text-gray-500">
            Score: {finalOutput.score}/10 · {finalOutput.iterations} iterations · {finalOutput.sources.length} sources
          </p>
        </div>
        <button
          type="button"
          onClick={copyReport}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs font-medium text-gray-200 transition hover:bg-gray-800"
        >
          {copied ? <Check className="h-4 w-4 text-green-300" /> : <Clipboard className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy report"}
        </button>
      </div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        className="prose prose-invert max-w-none prose-headings:text-gray-100 prose-a:text-indigo-300"
        components={{
          code({ className, children, ...props }) {
            return (
              <pre className="overflow-x-auto rounded-lg bg-gray-950 p-4 text-green-400">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            )
          },
        }}
      >
        {finalOutput.content}
      </ReactMarkdown>
      <section className="mt-8 border-t border-gray-800 pt-6">
        <h2 className="text-sm font-semibold text-gray-200">Sources</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-400">
          {finalOutput.sources.map((source) => (
            <li key={source}>
              <a href={source} target="_blank" rel="noreferrer" className="break-all text-indigo-300 hover:text-indigo-200">
                {source}
              </a>
            </li>
          ))}
        </ol>
      </section>
    </article>
  )
}
