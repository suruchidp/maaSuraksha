from fastapi import APIRouter

from ..schemas.schemas import PPDScreeningInput, PredictionResult
from ..main import model_registry

router = APIRouter()


@router.post("/predict", response_model=PredictionResult)
async def predict_ppd(input_data: PPDScreeningInput):
    return model_registry["ppd"].predict(input_data)