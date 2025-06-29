import json
from openai import AsyncOpenAI
from app.config import settings
from app.models.chat_schemas import ConversationItem

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

# Caché en memoria para respuestas del LLM
llm_cache = {}

async def generate_response(
    mensaje_usuario: str,
    fechas: list = None,
    conversation_history: list[ConversationItem] = None,
) -> dict:
    # Generar una clave única para la caché
    fechas_json = json.dumps(fechas, sort_keys=True) if fechas else ""
    history_json = (
        json.dumps([item.model_dump() for item in conversation_history], sort_keys=True)
        if conversation_history
        else ""
    )
    cache_key = (mensaje_usuario, fechas_json, history_json)

    # Intentar obtener la respuesta de la caché
    if cache_key in llm_cache:
        print("[DEBUG] Respondiendo desde la caché del LLM.")
        return llm_cache[cache_key]

    # Construir el prompt del sistema
    system_prompt = """
    Eres un asistente virtual excepcionalmente amable, paciente y empático, diseñado específicamente para ayudar a adultos mayores.
    Tu objetivo principal es facilitarles la vida, ofreciendo apoyo con recordatorios, salud, emergencias y manteniendo una conversación amigable.
    Siempre debes responder en español y en un formato JSON claro y predecido.

    El JSON de salida siempre debe contener tres campos: "intencion", "emocion" and "respuesta".

    1.  **intencion**: Clasifica el propósito del mensaje del usuario en una de las siguientes categorías:
        *   `RECORDATORIO`: Si el usuario quiere crear, modificar o preguntar sobre un recordatorio.
            (Ej: "Recuérdame la cita con el doctor", "tengo que tomar mis pastillas a las 8", "¿qué tenía que hacer mañana?")
        *   `EMERGENCIA`: Si el usuario expresa una necesidad de ayuda urgente o se encuentra en una situación de peligro.
            (Ej: "¡Ayuda, me caí!", "me siento muy mal", "necesito una ambulancia")
        *   `SALUD`: Si el usuario habla sobre su estado de salud, síntomas, o mediciones médicas.
            (Ej: "Hoy me duele la cabeza", "registra que mi presión es de 120/80", "¿cómo ha estado mi nivel de azúcar?")
        *   `CONVERSACION_GENERAL`: Para cualquier otra interacción que no encaje en las categorías anteriores.
            (Ej: "Hola, ¿cómo estás?", "¿qué tiempo hace hoy?", "cuéntame un chiste")

    2.  **emocion**: Infiere la emoción principal del usuario en el mensaje. Categorías posibles:
        *   `Positiva`: El usuario expresa alegría, gratitud, satisfacción.
        *   `Neutra`: El usuario es objetivo, informativo, sin emoción aparente.
        *   `Negativa`: El usuario expresa tristeza, frustración, enojo.
        *   `Preocupacion`: El usuario expresa ansiedad, inquietud, duda.
        *   `Urgencia`: El usuario expresa una necesidad inmediata o desesperación.

    3.  **respuesta**: Tu mensaje para el usuario. Debe ser siempre amable, claro y fácil de entender.
        *   Si la intención es `RECORDATORIO` y se detectan fechas, confirma la creación del recordatorio.
        *   Si la intención es `EMERGENCIA`, responde con calma y pregunta si necesitas contactar a alguien.
        *   Si la intención es `SALUD`, ofrece registrar la información o muestra empatía.
        *   Si es `CONVERSACION_GENERAL`, responde de forma natural y amigable.
    """

    # Construir los mensajes para la API de OpenAI
    messages_for_openai = [{"role": "system", "content": system_prompt}]

    # Añadir el historial de conversación
    if conversation_history:
        for item in conversation_history:
            messages_for_openai.append({"role": item.role, "content": item.content})

    # Añadir el mensaje actual del usuario
    messages_for_openai.append({"role": "user", "content": mensaje_usuario})

    # Añadir información de fechas si está disponible
    if fechas:
        messages_for_openai.append(
            {
                "role": "system",
                "content": f"Información de fecha y hora extraída del mensaje del usuario: {fechas}. Úsala para dar una respuesta más precisa si es relevante.",
            }
        )

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages_for_openai,
            response_format={"type": "json_object"},
            temperature=0.7, # Un poco de creatividad para que no suene tan robótico
        )

        llm_response_content = response.choices[0].message.content.strip()

        try:
            parsed_response = json.loads(llm_response_content)
            # Almacenar la respuesta en la caché antes de devolverla
            llm_cache[cache_key] = parsed_response
            return parsed_response
        except json.JSONDecodeError:
            print(f"[❌ LLM JSON ERROR] No se pudo parsear la respuesta del LLM: {llm_response_content}")
            # Fallback a una respuesta genérica si el JSON del LLM es inválido
            return {
                "intencion": "CONVERSACION_GENERAL",
                "respuesta": "Lo siento, me está costando un poco entenderte. ¿Podrías decírmelo de otra manera?",
            }

    except Exception as e:
        print(f"[❌ LLM ERROR] {e}")
        # Fallback a una respuesta de error genérica
        return {
            "intencion": "CONVERSACION_GENERAL",
            "respuesta": "Uhm, parece que tengo un pequeño problema técnico. Por favor, inténtalo de nuevo en un momento.",
        }