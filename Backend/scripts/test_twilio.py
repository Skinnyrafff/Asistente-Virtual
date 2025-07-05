from twilio.rest import Client
import sys
import os

# Añadir el directorio raíz del proyecto al sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from Backend.app.config import settings

# Inicializar el cliente de Twilio
try:
    twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    print("[DEBUG] Cliente de Twilio inicializado.")
except Exception as e:
    print(f"[ERROR] Error al inicializar el cliente de Twilio: {e}")
    exit()

# Número de teléfono al que enviar el SMS (el que proporcionaste)
to_phone_number = "+56935649334"

# Número de teléfono de Twilio (desde tus settings)
from_phone_number = settings.TWILIO_PHONE_NUMBER

message_body = "¡Hola desde tu Asistente Virtual! Este es un mensaje de prueba de Twilio."

try:
    print(f"[DEBUG] Intentando enviar SMS a {to_phone_number} desde {from_phone_number}...")
    message = twilio_client.messages.create(
        to=to_phone_number,
        from_=from_phone_number,
        body=message_body
    )
    print(f"[DEBUG] SMS enviado con éxito. SID del mensaje: {message.sid}")
    print("¡Twilio configurado y funcionando correctamente!")
except Exception as e:
    print(f"[ERROR] No se pudo enviar SMS a {to_phone_number}: {e}")
    print("Por favor, verifica tus credenciales de Twilio, el número de teléfono de origen y destino, y los permisos de tu cuenta.")
