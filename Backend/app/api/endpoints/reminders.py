from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from app.services import reminder_service, auth_service
from app.models.schemas import Reminder, ReminderCreate, ReminderUpdate
from app.services.database import get_db, User

router = APIRouter()

@router.post("/reminders/", response_model=Reminder)
def create_reminder_api(reminder: ReminderCreate, db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    """Crea un nuevo recordatorio."""
    return reminder_service.add_reminder(
        db=db, user_id=current_user.username, text=reminder.text, reminder_time=reminder.datetime
    )

@router.get("/reminders/", response_model=List[Reminder])
def get_reminders_api(db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    """Obtiene todos los recordatorios de un usuario."""
    reminders = reminder_service.get_user_reminders(db=db, user_id=current_user.username)
    # No es necesario un 404, una lista vacía es una respuesta válida.
    return reminders

@router.put("/reminders/{reminder_id}", response_model=Reminder)
def update_reminder_api(reminder_id: int, reminder_update: ReminderUpdate, db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    """Actualiza un recordatorio existente."""
    updated_reminder = reminder_service.update_reminder(
        db=db, 
        user_id=current_user.username,
        reminder_id=reminder_id, 
        text=reminder_update.text, 
        reminder_time=reminder_update.datetime
    )
    if not updated_reminder:
        raise HTTPException(status_code=404, detail="Recordatorio no encontrado.")
    return updated_reminder

@router.delete("/reminders/{reminder_id}", status_code=204)
def delete_reminder_api(reminder_id: int, db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    """Elimina un recordatorio."""
    success = reminder_service.delete_reminder(db=db, user_id=current_user.username, reminder_id=reminder_id)
    if not success:
        raise HTTPException(status_code=404, detail="Recordatorio no encontrado.")
    return