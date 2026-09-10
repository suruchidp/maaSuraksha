from fastapi import APIRouter

from ..schemas.schemas import HealthCheckResponse
from ..core.config import settings
from ..main import model_registry

router = APIRouter()


def _health_payload() -> HealthCheckResponse:
    return HealthCheckResponse(
        status="ok",
        service=settings.APP_NAME,
        version=settings.APP_VERSION,
        models={
            name: service.status_detail()
            for name, service in model_registry.items()
        },
    )


@router.get("/", response_model=HealthCheckResponse)
async def health_check():
    return _health_payload()


@router.get("/health", response_model=HealthCheckResponse)
async def health_check_path():
    return _health_payload()