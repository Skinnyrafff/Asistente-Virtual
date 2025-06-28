from sqlalchemy.orm import Session
from datetime import datetime
from app.services.database import HealthRecord

def save_health_data(
    db: Session, user_id: str, parameter: str, value: str, timestamp: str = None
) -> HealthRecord:
    """Guarda un nuevo registro de salud en la base de datos."""
    if timestamp is None:
        timestamp = datetime.now().isoformat()

    db_health_record = HealthRecord(user_id=user_id, parameter=parameter, value=value, timestamp=timestamp)
    db.add(db_health_record)
    db.commit()
    db.refresh(db_health_record)
    return db_health_record

def get_health_data(db: Session, user_id: str) -> list[HealthRecord]:
    """Obtiene todos los registros de salud de un usuario."""
    return db.query(HealthRecord).filter(HealthRecord.user_id == user_id).order_by(HealthRecord.timestamp.desc()).all()
