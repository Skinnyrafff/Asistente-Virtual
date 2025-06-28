from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from app.services import health_service
from app.models.schemas import HealthRecord, HealthRecordCreate
from app.services.database import get_db

router = APIRouter()


@router.post("/health/", response_model=HealthRecord)
def save_health_record_api(record: HealthRecordCreate, db: Session = Depends(get_db)):
    """Guarda un nuevo registro de salud."""
    return health_service.save_health_data(
        db=db,
        user_id=record.user_id,
        parameter=record.parameter,
        value=record.value,
        timestamp=record.timestamp
    )


@router.get("/health/{user_id}", response_model=List[HealthRecord])
def get_health_records_api(user_id: str, db: Session = Depends(get_db)):
    """Obtiene todos los registros de salud de un usuario."""
    records = health_service.get_health_data(db, user_id)
    if not records:
        raise HTTPException(
            status_code=404,
            detail="No se encontraron registros de salud para este usuario.",
        )
    return records
