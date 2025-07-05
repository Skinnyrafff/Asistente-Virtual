from pydantic import BaseModel, Field
from typing import Optional

class EmergencyContactBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone_number: str = Field(..., min_length=5, max_length=20, description="Número de teléfono del contacto de emergencia")
    relationship: Optional[str] = Field(None, max_length=50)

class EmergencyContactCreate(EmergencyContactBase):
    pass

class EmergencyContactUpdate(EmergencyContactBase):
    pass

class EmergencyContactResponse(EmergencyContactBase):
    id: int
    user_id: str

    class Config:
        from_attributes = True

class SMSSendRequest(BaseModel):
    to_phone_number: str = Field(..., description="Número de teléfono del destinatario del SMS")
    message_body: str = Field(..., description="Cuerpo del mensaje SMS")
