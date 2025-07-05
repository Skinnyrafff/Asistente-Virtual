from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.services import emergency_service, auth_service
from app.models.schemas import Emergency, EmergencyCreate
from app.models.emergency_schemas import EmergencyContactCreate, EmergencyContactUpdate, EmergencyContactResponse, SMSSendRequest
from app.services.database import get_db, User

router = APIRouter()


@router.post("/emergency/", response_model=Emergency)
async def registrar_emergencia_api(
    emergency: EmergencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Registra una nueva emergencia."""
    # Asegurarse de que la emergencia se registre para el usuario autenticado
    if emergency.user_id != current_user.username:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para registrar emergencias para otro usuario")
    return emergency_service.registrar_emergencia(
        db=db,
        user_id=current_user.username,
        tipo_emergencia=emergency.tipo_emergencia,
        mensaje_opcional=emergency.mensaje_opcional
    )


@router.get("/emergency/", response_model=List[Emergency])
async def obtener_emergencias_api(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Obtiene todos los registros de emergencia de un usuario autenticado."""
    emergencies = emergency_service.obtener_emergencias(db, current_user.username)
    if not emergencies:
        # No lanzar 404 si no hay emergencias, solo devolver una lista vacía
        return []
    return emergencies

# --- Emergency Contacts Endpoints ---

@router.post("/emergency/contacts/", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    contact: EmergencyContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Crea un nuevo contacto de emergencia para el usuario autenticado."""
    return emergency_service.create_emergency_contact(db, current_user.username, contact)

@router.get("/emergency/contacts/", response_model=List[EmergencyContactResponse])
async def get_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Obtiene todos los contactos de emergencia del usuario autenticado."""
    contacts = emergency_service.get_emergency_contacts(db, current_user.username)
    return contacts

@router.get("/emergency/contacts/{contact_id}", response_model=EmergencyContactResponse)
async def get_contact_by_id(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Obtiene un contacto de emergencia específico por ID para el usuario autenticado."""
    contact = emergency_service.get_emergency_contact(db, contact_id, current_user.username)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contacto de emergencia no encontrado")
    return contact

@router.put("/emergency/contacts/{contact_id}", response_model=EmergencyContactResponse)
async def update_contact(
    contact_id: int,
    contact_update: EmergencyContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Actualiza un contacto de emergencia existente para el usuario autenticado."""
    contact = emergency_service.update_emergency_contact(db, contact_id, current_user.username, contact_update)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contacto de emergencia no encontrado")
    return contact

@router.delete("/emergency/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Elimina un contacto de emergencia para el usuario autenticado."""
    contact = emergency_service.delete_emergency_contact(db, contact_id, current_user.username)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contacto de emergencia no encontrado")
    return {"message": "Contacto eliminado exitosamente"}

@router.post("/emergency/send-sms/", status_code=status.HTTP_200_OK)
async def send_emergency_sms(
    sms_request: SMSSendRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Envía un SMS de emergencia a un número específico."""
    success = emergency_service.send_sms_via_twilio(
        to_phone_number=sms_request.to_phone_number,
        message_body=sms_request.message_body
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo enviar el SMS.")
    return {"message": "SMS enviado exitosamente."}