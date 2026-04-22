from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from psycopg_pool import PoolTimeout
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.responses import JSONResponse

from tao.config import settings
from tao.db.connection import get_pool, close_pool
from api.middleware import limiter, ConcurrencyLimitMiddleware
from api.routers import dashboard, subnets, metagraph, balances


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_pool()
    yield
    close_pool()


app = FastAPI(title="Tao Monitor API", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(ConcurrencyLimitMiddleware, max_concurrent=20)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["GET"],
    allow_headers=["Content-Type"],
)

app.include_router(dashboard.router, prefix="/api/dashboard")
app.include_router(subnets.router, prefix="/api")
app.include_router(metagraph.router, prefix="/api")
app.include_router(balances.router, prefix="/api")


@app.exception_handler(PoolTimeout)
async def pool_timeout_handler(request, exc):
    return JSONResponse(status_code=503, content={"detail": "Database busy"})


@app.get("/health")
def health():
    return {"status": "ok"}
