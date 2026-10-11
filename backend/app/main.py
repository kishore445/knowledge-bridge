"""FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import close_connection
from .routes import auth, schools, kabadiwalas, inventory, orders
from .routes import sponsorships, resale, deliveries, donors, impact, admin, certificates
from .routes import ai_chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_connection()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Knowledge Bridge API",
        description="Move used school books from homes and kabadiwalas to government schools.",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix="/api")
    app.include_router(schools.router, prefix="/api")
    app.include_router(kabadiwalas.router, prefix="/api")
    app.include_router(inventory.router, prefix="/api")
    app.include_router(orders.router, prefix="/api")
    app.include_router(sponsorships.router, prefix="/api")
    app.include_router(resale.router, prefix="/api")
    app.include_router(deliveries.router, prefix="/api")
    app.include_router(donors.router, prefix="/api")
    app.include_router(impact.router, prefix="/api")
    app.include_router(admin.router, prefix="/api")
    app.include_router(certificates.router, prefix="/api")
    app.include_router(ai_chat.router, prefix="/api")

    @app.get("/api/health")
    async def health():
        return {"status": "ok", "service": "knowledge-bridge"}

    return app


app = create_app()
