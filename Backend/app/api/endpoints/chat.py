from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.schemas import ChatInput, ChatResponse
from app.models.chat_schemas import ConversationItem
from app.services import duckling_service, llm_service, reminder_service, emergency_service, health_service
from app.services.database import get_db, ConversationHistory

router = APIRouter()

@router.post("/chat/", response_model=ChatResponse)
async def chat_endpoint(input: ChatInput, db: Session = Depends(get_db)):
    """
    Punto de entrada principal para la conversación.
    Analiza el mensaje, extrae fechas, clasifica la intención y genera una respuesta.
    Redirige a servicios específicos según la intención detectada.
    """
    try:
        # 1. Extraer fechas con Duckling
        fechas_detectadas = await duckling_service.extract_dates_with_duckling(input.message)

        # 2. Generar una respuesta y determinar la intención con el LLM
        llm_output = await llm_service.generate_response(input.message, fechas_detectadas, input.conversation_history)
        intencion = llm_output.get("intencion", "CONVERSACION_GENERAL")
        respuesta_llm = llm_output.get("respuesta", "Lo siento, no pude generar una respuesta.")
        emocion = llm_output.get("emocion", "Neutra") # Extraer la emoción

        print(f"[DEBUG] Intención detectada por LLM: {intencion}, Emoción: {emocion}")

        # 3. Redirigir acciones según la intención
        if intencion == "RECORDATORIO":
            if fechas_detectadas:
                primera_fecha = fechas_detectadas[0]["value"]["value"]
                reminder_service.add_reminder(
                    db=db,
                    user_id=input.user_id,
                    text=input.message,
                    reminder_time=primera_fecha
                )
                print(f"[DEBUG] Recordatorio guardado para {input.user_id} en {primera_fecha}")
            else:
                print("[DEBUG] Intención RECORDATORIO pero sin fechas detectadas por Duckling.")
                respuesta_llm += " Para guardar un recordatorio, necesito una fecha y hora específicas."

        elif intencion == "EMERGENCIA":
            emergency_service.registrar_emergencia(
                db=db, 
                user_id=input.user_id,
                tipo_emergencia="Solicitud de emergencia",
                mensaje_opcional=input.message
            )
            print(f"[DEBUG] Emergencia registrada para {input.user_id}")
            respuesta_llm = "¡Alerta de emergencia activada! Ya he notificado a los contactos de emergencia. Mantén la calma."

        elif intencion == "SALUD":
            # Aquí iría la lógica para extraer el parámetro y el valor de salud del mensaje
            # Por ahora, guardamos un registro genérico
            health_service.save_health_data(db=db, user_id=input.user_id, parameter="unknown", value=input.message)
            print(f"[DEBUG] Intención SALUD detectada. Lógica de guardado de salud iría aquí.")

        # 4. Guardar el historial de la conversación
        db.add(ConversationHistory(user_id=input.user_id, role="user", content=input.message))
        db.add(ConversationHistory(user_id=input.user_id, role="assistant", content=respuesta_llm))
        db.commit()

        # 5. Devolver la respuesta al frontend
        return {"respuesta": respuesta_llm, "fechas_detectadas": fechas_detectadas, "emocion": emocion}

    except Exception as e:
        print(f"[❌ CHAT_ENDPOINT ERROR] {e}")
        raise HTTPException(
            status_code=500, detail="Ocurrió un error interno en el chat."
        )
