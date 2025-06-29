from sqlalchemy.orm import Session
from datetime import datetime
from app.services.database import HealthRecord

def save_health_data(
    db: Session, user_id: str, parameter: str, value: str, timestamp: str = None
) -> HealthRecord:
    """Guarda un nuevo registro de salud en la base de datos."""
    if timestamp is None:
        timestamp = datetime.utcnow()

    db_health_record = HealthRecord(user_id=user_id, parameter=parameter, value=value, timestamp=timestamp)
    db.add(db_health_record)
    db.commit()
    db.refresh(db_health_record)
    return db_health_record

def get_health_data(db: Session, user_id: str) -> list[HealthRecord]:
    """Obtiene todos los registros de salud de un usuario."""
    return db.query(HealthRecord).filter(HealthRecord.user_id == user_id).order_by(HealthRecord.timestamp.desc()).all()

def update_health_data(db: Session, record_id: int, parameter: str, value: str) -> HealthRecord | None:
    """Actualiza un registro de salud existente."""
    db_record = db.query(HealthRecord).filter(HealthRecord.id == record_id).first()
    if db_record:
        db_record.parameter = parameter
        db_record.value = value
        db.commit()
        db.refresh(db_record)
    return db_record

def delete_health_data(db: Session, record_id: int) -> bool:
    """Elimina un registro de salud existente."""
    db_record = db.query(HealthRecord).filter(HealthRecord.id == record_id).first()
    if db_record:
        db.delete(db_record)
        db.commit()
        return True
    return False
