import json
from openai import OpenAI
from app.config import settings


client = OpenAI(api_key=settings.OPENAI_API_KEY)

# Caché en memoria para respuestas del LLM
llm_cache = {}

def generate_response(mensaje_usuario: str, fechas: list = None, conversation_history: list = None) -> dict:
    # Generar una clave única para la caché
    fechas_json = json.dumps(fechas, sort_keys=True) if fechas else None
    history_json = json.dumps(conversation_history, sort_keys=True) if conversation_history else None
    cache_key = (mensaje_usuario, fechas_json, history_json)

    # Intentar obtener la respuesta de la caché
    if cache_key in llm_cache:
        print("[DEBUG] Respondiendo desde la caché del LLM.")
        return llm_cache[cache_key]

    fecha_info = ""
    if fechas:
        fecha_info = f"\n\nInformación de fecha detectada:\n{fechas}"

    # Construir los mensajes para la API de OpenAI
    messages_for_openai = [
        {
            "role": "system",
            "content": "Eres un asistente empático y servicial para personas mayores. Siempre responde en español y en formato JSON.",
        },
    ]

    # Añadir el historial de conversación
    if conversation_history:
        for item in conversation_history:
            messages_for_openai.append({"role": item.role, "content": item.content})

    # Añadir el mensaje actual del usuario
    messages_for_openai.append({"role": "user", "content": prompt.strip()})

    prompt = f"""
Actúa como un asistente virtual amable y empático para adultos mayores.
Analiza el siguiente mensaje del usuario y devuelve una respuesta en formato JSON.

El JSON debe contener dos campos:
1.  "intencion": Una de las siguientes categorías: "RECORDATORIO", "EMERGENCIA", "SALUD", "CONVERSACION_GENERAL".
    *   "RECORDATORIO": Si el usuario expresa la necesidad de recordar algo en el futuro (ej. "recuérdame tomar mis pastillas", "cita con el médico mañana").
    *   "EMERGENCIA": Si el usuario indica una situación de peligro o urgencia (ej. "me caí", "me siento muy mal", "necesito ayuda urgente").
    *   "SALUD": Si el usuario pregunta o informa sobre su estado de salud, síntomas, mediciones (ej. "cómo está mi presión", "me duele la cabeza", "registra mi glucosa").
    *   "CONVERSACION_GENERAL": Para cualquier otra interacción, saludo, pregunta general, etc.

2.  "respuesta": Tu mensaje amigable y empático para el usuario, basado en su mensaje y la intención detectada.

Mensaje del usuario:
\"{mensaje_usuario}\"

{fecha_info}

Ejemplo de JSON de salida:
{{
    "intencion": "CONVERSACION_GENERAL",
    "respuesta": "¡Hola! ¿En qué puedo ayudarte hoy?"
}}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages_for_openai, # Usar los mensajes construidos
            response_format={"type": "json_object"}, # Indica a OpenAI que esperamos un JSON
        )
        
        llm_response_content = response.choices[0].message.content.strip()
        
        try:
            parsed_response = json.loads(llm_response_content)
            # Almacenar la respuesta en la caché antes de devolverla
            llm_cache[cache_key] = parsed_response
            return parsed_response
        except json.JSONDecodeError:
            print(f"[❌ LLM JSON ERROR] No se pudo parsear la respuesta del LLM como JSON: {llm_response_content}")
            return {
                "intencion": "CONVERSACION_GENERAL",
                "respuesta": "Lo siento, tuve un problema para entenderte. ¿Podrías repetirlo de otra forma?",
            }

    except Exception as e:
        print(f"[❌ LLM ERROR] {e}")
        return {
            "intencion": "CONVERSACION_GENERAL",
            "respuesta": "Lo siento, ocurrió un error al generar la respuesta. Por favor, inténtalo de nuevo más tarde.",
        }
