from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from tao.config import settings
from tao.db.connection import get_pool, close_pool
from api.routers import dashboard, subnets, metagraph, balances


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_pool()
    yield
    close_pool()


app = FastAPI(title="Tao Monitor API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["GET", "PUT", "DELETE", "PATCH"],
    allow_headers=["Content-Type"],
)

app.include_router(dashboard.router, prefix="/api/dashboard")
app.include_router(subnets.router, prefix="/api")
app.include_router(metagraph.router, prefix="/api")
app.include_router(balances.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
