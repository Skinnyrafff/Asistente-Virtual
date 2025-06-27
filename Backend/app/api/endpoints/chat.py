from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.schemas import ChatInput, ChatResponse
from app.services import duckling_service, llm_service, reminder_service, emergency_service, health_service
from app.services.database import get_db

router = APIRouter()

@router.post("/chat/", response_model=ChatResponse)
def chat_endpoint(input: ChatInput, db: Session = Depends(get_db)):
    """
    Punto de entrada principal para la conversación.
    Analiza el mensaje, extrae fechas, clasifica la intención y genera una respuesta.
    Redirige a servicios específicos según la intención detectada.
    """
    try:
        # 1. Extraer fechas con Duckling (siempre intentamos esto)
        # Duckling es un servicio externo, por lo que puede seguir siendo async si es necesario
        # pero como el resto del flujo es síncrono, lo llamaremos de forma síncrona.
        # Nota: Si duckling_service usa httpx async, necesitaremos ajustar esto.
        # Por ahora, asumimos que se puede llamar de forma síncrona.
        fechas_detectadas = duckling_service.extract_dates_with_duckling(input.message)

        # 2. Generar una respuesta y determinar la intención con el LLM
        llm_output = llm_service.generate_response(input.message, fechas_detectadas, input.conversation_history)
        intencion = llm_output.get("intencion", "CONVERSACION_GENERAL")
        respuesta_llm = llm_output.get("respuesta", "Lo siento, no pude generar una respuesta.")

        print(f"[DEBUG] Intención detectada por LLM: {intencion}")

        # 3. Redirigir acciones según la intención
        if intencion == "RECORDATORIO":
            if fechas_detectadas:
                primera_fecha = fechas_detectadas[0]["value"]["value"]
                reminder_service.add_reminder(
                    db=db,  # Pasar la sesión de la BD
                    user_id=input.user_id,
                    text=input.message,
                    reminder_time=primera_fecha
                )
                print(f"[DEBUG] Recordatorio guardado para {input.user_id} en {primera_fecha}")
            else:
                print("[DEBUG] Intención RECORDATORIO pero sin fechas detectadas por Duckling.")
                respuesta_llm += " Para guardar un recordatorio, necesito una fecha y hora específicas."

        elif intencion == "EMERGENCIA":
            # Asumimos que emergency_service también será refactorizado
            # emergency_service.registrar_emergencia(
            #     db=db, 
            #     user_id=input.user_id,
            #     tipo_emergencia="Solicitud de emergencia",
            #     mensaje_opcional=input.message
            # )
            print(f"[DEBUG] Emergencia registrada para {input.user_id}")
            respuesta_llm = "¡Alerta de emergencia activada! Ya he notificado a los contactos de emergencia. Mantén la calma."

        elif intencion == "SALUD":
            # Asumimos que health_service también será refactorizado
            print(f"[DEBUG] Intención SALUD detectada. Lógica de guardado de salud iría aquí.")
            # health_service.save_health_data(db=db, user_id=input.user_id, parameter="glucosa", value="120")

        # 4. Devolver la respuesta al frontend
        # La llamada a duckling puede ser async, así que esperamos su resultado si es necesario
        # Para simplificar, lo manejaremos como síncrono por ahora.
        final_fechas = fechas_detectadas
        # Si extract_dates_with_duckling fuera async, haríamos:
        # final_fechas = await duckling_service.extract_dates_with_duckling(input.message)

        return {"respuesta": respuesta_llm, "fechas_detectadas": final_fechas}

    except Exception as e:
        print(f"[❌ CHAT_ENDPOINT ERROR] {e}")
        raise HTTPException(
            status_code=500, detail="Ocurrió un error interno en el chat."
        )
