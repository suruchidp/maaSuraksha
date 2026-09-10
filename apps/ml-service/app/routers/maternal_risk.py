from fastapi import APIRouter

from ..schemas.schemas import MaternalRiskInput, PredictionResult
from ..main import model_registry

router = APIRouter()


@router.post("/predict", response_model=PredictionResult)
async def predict_maternal_risk(input_data: MaternalRiskInput):
    return model_registry["maternal_risk"].predict(input_data)