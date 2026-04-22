import asyncio

from slowapi import Limiter
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


def get_real_ip(request: Request) -> str:
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=get_real_ip)


class ConcurrencyLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_concurrent: int = 20):
        super().__init__(app)
        self.semaphore = asyncio.Semaphore(max_concurrent)

    async def dispatch(self, request: Request, call_next):
        if not self.semaphore._value:
            return JSONResponse(status_code=503, content={"detail": "Server busy"})
        async with self.semaphore:
            return await call_next(request)
