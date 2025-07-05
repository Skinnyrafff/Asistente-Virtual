from sqlalchemy.orm import Session
from datetime import datetime
from app.services.database import Emergency, EmergencyContact
from app.models.emergency_schemas import EmergencyContactCreate, EmergencyContactUpdate
from app.config import settings
from twilio.rest import Client

# Inicializar el cliente de Twilio
twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

def send_sms_via_twilio(to_phone_number: str, message_body: str) -> bool:
    """Envía un SMS a través de Twilio."""
    try:
        message = twilio_client.messages.create(
            to=to_phone_number,
            from_=settings.TWILIO_PHONE_NUMBER,
            body=message_body
        )
        print(f"[DEBUG] SMS enviado con éxito. SID del mensaje: {message.sid}")
        return True
    except Exception as e:
        print(f"[ERROR] No se pudo enviar SMS a {to_phone_number}: {e}")
        return False

def registrar_emergencia(
    db: Session, user_id: str, tipo_emergencia: str, mensaje_opcional: str = ""
) -> Emergency:
    """Registra una nueva emergencia en la base de datos y notifica a los contactos de emergencia."""
    timestamp = datetime.utcnow()
    db_emergency = Emergency(user_id=user_id, tipo_emergencia=tipo_emergencia, mensaje_opcional=mensaje_opcional, timestamp=timestamp)
    db.add(db_emergency)
    db.commit()
    db.refresh(db_emergency)

    # Notificar a los contactos de emergencia (esta lógica se moverá al frontend para el protocolo)
    # contacts = get_emergency_contacts(db, user_id)
    # message_body = f"ALERTA DE EMERGENCIA: El usuario {user_id} ha activado una emergencia. Tipo: {tipo_emergencia}. Mensaje: {mensaje_opcional}"
    # for contact in contacts:
    #     try:
    #         twilio_client.messages.create(
    #             to=contact.phone_number,
    #             from_=settings.TWILIO_PHONE_NUMBER,
    #             body=message_body
    #         )
    #         print(f"[DEBUG] SMS de emergencia enviado a {contact.name} ({contact.phone_number})")
    #     except Exception as e:
    #         print(f"[ERROR] No se pudo enviar SMS a {contact.name} ({contact.phone_number}): {e}")

    return db_emergency

def obtener_emergencias(db: Session, user_id: str) -> list[Emergency]:
    """Obtiene todas las emergencias de un usuario."""
    return db.query(Emergency).filter(Emergency.user_id == user_id).order_by(Emergency.timestamp.desc()).all()

# --- Emergency Contact CRUD Operations ---

def create_emergency_contact(
    db: Session, user_id: str, contact: EmergencyContactCreate
) -> EmergencyContact:
    """Crea un nuevo contacto de emergencia para un usuario."""
    db_contact = EmergencyContact(
        user_id=user_id,
        name=contact.name,
        phone_number=contact.phone_number,
        relationship=contact.relationship
    )
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

def get_emergency_contacts(db: Session, user_id: str) -> list[EmergencyContact]:
    """Obtiene todos los contactos de emergencia de un usuario."""
    return db.query(EmergencyContact).filter(EmergencyContact.user_id == user_id).all()

def get_emergency_contact(
    db: Session, contact_id: int, user_id: str
) -> EmergencyContact | None:
    """Obtiene un contacto de emergencia específico por ID y user_id."""
    return (
        db.query(EmergencyContact)
        .filter(EmergencyContact.id == contact_id, EmergencyContact.user_id == user_id)
        .first()
    )

def update_emergency_contact(
    db: Session, contact_id: int, user_id: str, contact_update: EmergencyContactUpdate
) -> EmergencyContact | None:
    """Actualiza un contacto de emergencia existente."""
    db_contact = get_emergency_contact(db, contact_id, user_id)
    if db_contact:
        for key, value in contact_update.model_dump(exclude_unset=True).items():
            setattr(db_contact, key, value)
        db.commit()
        db.refresh(db_contact)
    return db_contact

def delete_emergency_contact(
    db: Session, contact_id: int, user_id: str
) -> EmergencyContact | None:
    """Elimina un contacto de emergencia."""
    db_contact = get_emergency_contact(db, contact_id, user_id)
    if db_contact:
        db.delete(db_contact)
        db.commit()
    return db_contact
