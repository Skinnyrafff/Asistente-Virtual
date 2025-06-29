from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from app.services import emergency_service
from app.models.schemas import Emergency, EmergencyCreate
from app.services.database import get_db

router = APIRouter()


@router.post("/emergency/", response_model=Emergency)
def registrar_emergencia_api(emergency: EmergencyCreate, db: Session = Depends(get_db)):
    """Registra una nueva emergencia."""
    return emergency_service.registrar_emergencia(
        db=db,
        user_id=emergency.user_id,
        tipo_emergencia=emergency.tipo_emergencia,
        mensaje_opcional=emergency.mensaje_opcional
    )


@router.get("/emergency/{user_id}", response_model=List[Emergency])
def obtener_emergencias_api(user_id: str, db: Session = Depends(get_db)):
    """Obtiene todos los registros de emergencia de un usuario."""
    emergencies = emergency_service.obtener_emergencias(db, current_user.username)
    if not emergencies:
        raise HTTPException(
            status_code=404,
            detail="No se encontraron registros de emergencia para este usuario.",
        )
    return emergencies
