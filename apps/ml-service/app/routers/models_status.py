from fastapi import APIRouter

from ..schemas.schemas import ModelsStatusResponse
from ..main import model_registry

router = APIRouter()


@router.get("/status", response_model=ModelsStatusResponse)
async def models_status():
    return ModelsStatusResponse(
        models={
            name: {
                "model_status": service.get_status(),
                "reason": service.status_detail().get("reason"),
                "version": service.status_detail().get("version"),
                "artifact_type": service.status_detail().get("artifact_type"),
                "model_name": service.status_detail().get("model_name"),
                "trained_at": service.status_detail().get("trained_at"),
            }
            for name, service in model_registry.items()
        }
    )