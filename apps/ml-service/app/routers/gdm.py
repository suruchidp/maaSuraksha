from fastapi import APIRouter

from ..schemas.schemas import GDMInput, PredictionResult
from ..main import model_registry

router = APIRouter()


@router.post("/predict", response_model=PredictionResult)
async def predict_gdm(input_data: GDMInput):
    return model_registry["gdm"].predict(input_data)