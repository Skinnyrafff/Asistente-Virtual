from sqlalchemy.orm import Session
from app.services.database import Reminder

def add_reminder(db: Session, user_id: str, text: str, reminder_time: str) -> Reminder:
    """Añade un nuevo recordatorio a la base de datos."""
    db_reminder = Reminder(user_id=user_id, text=text, datetime=reminder_time)
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

def get_user_reminders(db: Session, user_id: str) -> list[Reminder]:
    """Obtiene todos los recordatorios de un usuario."""
    return db.query(Reminder).filter(Reminder.user_id == user_id).order_by(Reminder.datetime.desc()).all()

def delete_reminder(db: Session, reminder_id: int) -> bool:
    """Elimina un recordatorio por su ID."""
    db_reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if db_reminder:
        db.delete(db_reminder)
        db.commit()
        return True
    return False

def update_reminder(db: Session, reminder_id: int, text: str, reminder_time: str) -> Reminder | None:
    """Actualiza un recordatorio existente."""
    db_reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if db_reminder:
        db_reminder.text = text
        db_reminder.datetime = reminder_time
        db.commit()
        db.refresh(db_reminder)
        return db_reminder
    return None

def get_reminder_by_id(db: Session, reminder_id: int) -> Reminder | None:
    """Obtiene un recordatorio específico por su ID."""
    return db.query(Reminder).filter(Reminder.id == reminder_id).first()