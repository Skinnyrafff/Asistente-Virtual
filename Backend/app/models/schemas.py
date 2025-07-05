from pydantic import BaseModel
from typing import Optional, List
from .chat_schemas import ConversationItem
from datetime import datetime

class ChatInput(BaseModel):
    message: str
    conversation_history: List[ConversationItem] = []


class ChatResponse(BaseModel):
    respuesta: str
    fechas_detectadas: list
    emocion: str # Nuevo campo para la emoción detectada


# Esquemas para Recordatorios (Reminders)
class ReminderBase(BaseModel):
    text: str
    datetime: str


class ReminderCreate(ReminderBase):
    pass


class Reminder(ReminderBase):
    id: int

    class Config:
        from_attributes = True


class ReminderUpdate(BaseModel):
    text: Optional[str] = None
    datetime: Optional[str] = None


# Esquemas para Salud (Health)
from pydantic import BaseModel
from datetime import datetime

class HealthRecordBase(BaseModel):
    parameter: str
    value: str

class HealthRecordCreate(HealthRecordBase):
    timestamp: datetime | None = None

class HealthRecordUpdate(HealthRecordBase):
    pass

class HealthRecord(HealthRecordBase):
    id: int
    user_id: str
    timestamp: datetime

    class Config:
        from_attributes = True



# Esquemas para Emergencias (Emergency)
class EmergencyBase(BaseModel):
    tipo_emergencia: str
    mensaje_opcional: Optional[str] = ""


class EmergencyCreate(EmergencyBase):
    user_id: str


class Emergency(EmergencyBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
