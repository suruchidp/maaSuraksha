import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .models.registry import model_registry
from .routers import gdm, health, maternal_risk, models_status, mood, ppd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ML service; checking model artifacts...")
    for name, service in model_registry.items():
        available = service.get_status()
        logger.info(
            "Model '%s': %s (%s)",
            name,
            available,
            service.unavailable_reason()[:120] if available == "MODEL_UNAVAILABLE" else "ready",
        )
    yield
    logger.info("Shutting down ML service.")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    allowed_origins = (
        ["*"]
        if settings.CORS_ORIGINS.strip() == "*"
        else [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=settings.CORS_ORIGINS.strip() != "*",
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, tags=["Health"])
    app.include_router(models_status.router, prefix="/api/v1/models", tags=["Models"])
    app.include_router(maternal_risk.router, prefix="/api/v1/maternal-risk", tags=["Maternal Risk"])
    app.include_router(gdm.router, prefix="/api/v1/gdm", tags=["GDM"])
    app.include_router(ppd.router, prefix="/api/v1/ppd", tags=["PPD Screening"])
    app.include_router(mood.router, prefix="/api/v1/mood", tags=["Mood Analysis"])

    return app


app = create_app()