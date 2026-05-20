import asyncio
import json
from typing import AsyncGenerator, Optional

from graph.state import AgentEvent


class StreamingManager:
    def __init__(self) -> None:
        self.queues: dict[str, asyncio.Queue[Optional[AgentEvent]]] = {}

    def create_job(self, job_id: str) -> None:
        self.queues[job_id] = asyncio.Queue(maxsize=100)

    def has_job(self, job_id: str) -> bool:
        return job_id in self.queues

    async def emit(self, job_id: str, event: AgentEvent) -> None:
        queue = self.queues.get(job_id)
        if queue is None:
            return
        await queue.put(event)

    async def stream(self, job_id: str) -> AsyncGenerator[bytes, None]:
        queue = self.queues.get(job_id)
        if queue is None:
            return

        while True:
            event = await queue.get()
            if event is None:
                break
            payload = event.model_dump()
            yield f"data: {json.dumps(payload, default=str)}\n\n".encode("utf-8")

    def close_job(self, job_id: str) -> None:
        queue = self.queues.get(job_id)
        if queue is None:
            return
        queue.put_nowait(None)

    def cleanup_job(self, job_id: str) -> None:
        self.queues.pop(job_id, None)


streaming_manager = StreamingManager()
