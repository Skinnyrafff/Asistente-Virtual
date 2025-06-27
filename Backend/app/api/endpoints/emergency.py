from fastapi import APIRouter, HTTPException
from typing import List
from app.services import emergency_service
from app.models.schemas import Emergency, EmergencyCreate

router = APIRouter()


@router.post("/emergency/", response_model=Emergency)
async def registrar_emergencia_api(emergency: EmergencyCreate):
    """Registra una nueva emergencia."""
    await emergency_service.registrar_emergencia(
        user_id=emergency.user_id,
        tipo_emergencia=emergency.tipo_emergencia,
        mensaje_opcional=emergency.mensaje_opcional
    )
    # Para obtener el timestamp generado por el servicio, recuperamos el registro
    emergencies = await emergency_service.obtener_emergencias(emergency.user_id)
    new_emergency = emergencies[0]
    return new_emergency


@router.get("/emergency/{user_id}", response_model=List[Emergency])
async def obtener_emergencias_api(user_id: str):
    """Obtiene todos los registros de emergencia de un usuario."""
    emergencies = await emergency_service.obtener_emergencias(user_id)
    if not emergencies:
        raise HTTPException(
            status_code=404,
            detail="No se encontraron registros de emergencia para este usuario.",
        )
    return emergencies
