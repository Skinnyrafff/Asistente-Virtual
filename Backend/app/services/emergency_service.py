from sqlalchemy.orm import Session
from datetime import datetime
from app.services.database import Emergency

def registrar_emergencia(
    db: Session, user_id: str, tipo_emergencia: str, mensaje_opcional: str = ""
) -> Emergency:
    """Registra una nueva emergencia en la base de datos."""
    timestamp = datetime.utcnow()
    db_emergency = Emergency(user_id=user_id, tipo_emergencia=tipo_emergencia, mensaje_opcional=mensaje_opcional, timestamp=timestamp)
    db.add(db_emergency)
    db.commit()
    db.refresh(db_emergency)
    return db_emergency

def obtener_emergencias(db: Session, user_id: str) -> list[Emergency]:
    """Obtiene todas las emergencias de un usuario."""
    return db.query(Emergency).filter(Emergency.user_id == user_id).order_by(Emergency.timestamp.desc()).all()
