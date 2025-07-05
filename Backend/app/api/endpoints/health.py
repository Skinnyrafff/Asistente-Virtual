from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.services import health_service, auth_service
from app.models.schemas import HealthRecord, HealthRecordCreate, HealthRecordUpdate
from app.services.database import get_db, User

router = APIRouter()

@router.get("/health/status")
def get_health_status():
    """Verifica el estado de la API."""
    return {"status": "ok"}

@router.post("/health/", response_model=HealthRecord, status_code=status.HTTP_201_CREATED)
def save_health_record_api(record: HealthRecordCreate, db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    """Guarda un nuevo registro de salud."""
    return health_service.save_health_data(
        db=db,
        user_id=current_user.username,
        parameter=record.parameter,
        value=record.value,
        timestamp=record.timestamp
    )


@router.get("/health/", response_model=List[HealthRecord])
def get_health_records_api(db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    """Obtiene todos los registros de salud de un usuario."""
    records = health_service.get_health_data(db, current_user.username)
    if not records:
        raise HTTPException(
            status_code=404,
            detail="No se encontraron registros de salud para este usuario.",
        )
    return records

@router.put("/health/{record_id}", response_model=HealthRecord)
def update_health_record_api(record_id: int, record: HealthRecordUpdate, db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    """Actualiza un registro de salud existente."""
    db_record = health_service.update_health_data(db, record_id, record.parameter, record.value)
    if not db_record or db_record.user_id != current_user.username:
        raise HTTPException(status_code=404, detail="Registro de salud no encontrado o no autorizado")
    return db_record

@router.delete("/health/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_health_record_api(record_id: int, db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    """Elimina un registro de salud existente."""
    # First, verify the record belongs to the current user before deleting
    record_to_delete = db.query(health_service.HealthRecord).filter(health_service.HealthRecord.id == record_id).first()
    if not record_to_delete or record_to_delete.user_id != current_user.username:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro de salud no encontrado o no autorizado")

    if not health_service.delete_health_data(db, record_id):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo eliminar el registro de salud")
    return {"message": "Registro de salud eliminado exitosamente"}
