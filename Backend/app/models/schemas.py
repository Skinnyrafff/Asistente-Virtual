from pydantic import BaseModel
from typing import Optional, List
from .chat_schemas import ConversationItem

class ChatInput(BaseModel):
    message: str
    user_id: str
    conversation_history: List[ConversationItem] = []


class ChatResponse(BaseModel):
    respuesta: str
    fechas_detectadas: list


# Esquemas para Recordatorios (Reminders)
class ReminderBase(BaseModel):
    text: str
    datetime: str


class ReminderCreate(ReminderBase):
    user_id: str


class Reminder(ReminderBase):
    id: int
    user_id: str

    class Config:
        from_attributes = True


class ReminderUpdate(BaseModel):
    text: Optional[str] = None
    datetime: Optional[str] = None


# Esquemas para Salud (Health)
class HealthRecordBase(BaseModel):
    parameter: str
    value: str


class HealthRecordCreate(HealthRecordBase):
    user_id: str
    timestamp: Optional[str] = None


class HealthRecord(HealthRecordBase):
    id: int
    user_id: str
    timestamp: str

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
    user_id: str
    timestamp: str

    class Config:
        from_attributes = True
