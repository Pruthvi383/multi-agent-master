import asyncio
import os
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from redis import Redis
from sse_starlette.sse import EventSourceResponse

from graph.orchestrator import run_pipeline
from graph.state import AgentEvent
from utils.streaming import streaming_manager

router = APIRouter()


class ResearchRequest(BaseModel):
    query: str = Field(..., min_length=10, max_length=500)


def get_redis_client() -> Redis:
    return Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)


async def _run_job(query: str, job_id: str) -> None:
    async def emit_fn(event: AgentEvent):
        await streaming_manager.emit(job_id, event)

    try:
        await run_pipeline(query, job_id, emit_fn)
    except Exception as exc:
        await streaming_manager.emit(
            job_id,
            AgentEvent(
                event_type="error",
                agent="system",
                message=f"Job failed: {exc}",
            ),
        )
    finally:
        streaming_manager.close_job(job_id)


@router.post("/research")
async def start_research(request: ResearchRequest):
    job_id = str(uuid.uuid4())
    streaming_manager.create_job(job_id)
    asyncio.create_task(_run_job(request.query, job_id))
    return {"job_id": job_id, "status": "started"}


@router.get("/stream/{job_id}")
async def stream_job(job_id: str):
    if not streaming_manager.has_job(job_id):
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator():
        try:
            async for event in streaming_manager.stream(job_id):
                yield event
        finally:
            streaming_manager.cleanup_job(job_id)

    return EventSourceResponse(
        event_generator(),
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/health")
async def health():
    redis_ok = False
    try:
        redis_ok = bool(get_redis_client().ping())
    except Exception:
        redis_ok = False
    return {"status": "ok", "redis": redis_ok}
