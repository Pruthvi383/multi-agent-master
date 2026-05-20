import { NextResponse } from "next/server"

interface ResearchRequest {
  query?: string
}

export async function POST(request: Request) {
  let body: ResearchRequest

  try {
    body = (await request.json()) as ResearchRequest
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 })
  }

  const query = body.query?.trim() ?? ""

  if (query.length < 10 || query.length > 500) {
    return NextResponse.json(
      { detail: "Query must be between 10 and 500 characters" },
      { status: 422 }
    )
  }

  const jobId = crypto.randomUUID()
  const streamUrl = `/api/stream/${jobId}?query=${encodeURIComponent(query)}`

  return NextResponse.json({
    job_id: jobId,
    status: "started",
    stream_url: streamUrl,
  })
}
