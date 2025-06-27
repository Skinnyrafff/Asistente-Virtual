from fastapi import APIRouter, HTTPException
from typing import List
from app.services import health_service
from app.models.schemas import HealthRecord, HealthRecordCreate

router = APIRouter()


@router.post("/health/", response_model=HealthRecord)
async def save_health_record_api(record: HealthRecordCreate):
    """Guarda un nuevo registro de salud."""
    await health_service.save_health_data(
        user_id=record.user_id,
        parameter=record.parameter,
        value=record.value,
        timestamp=record.timestamp
    )
    # El timestamp se genera en el servicio si es None, así que lo recuperamos para la respuesta
    new_record = await health_service.get_health_data(
        record.user_id
    )  # Asumiendo que el último es el nuevo
    return new_record[0]


@router.get("/health/{user_id}", response_model=List[HealthRecord])
async def get_health_records_api(user_id: str):
    """Obtiene todos los registros de salud de un usuario."""
    records = await health_service.get_health_data(user_id)
    if not records:
        raise HTTPException(
            status_code=404,
            detail="No se encontraron registros de salud para este usuario.",
        )
    return records
