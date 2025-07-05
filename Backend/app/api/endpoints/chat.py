from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.schemas import ChatInput, ChatResponse
from app.models.chat_schemas import ConversationItem
from app.services import duckling_service, llm_service, reminder_service, emergency_service, health_service, auth_service, weather_service, gnews_service
from app.services.database import get_db, ConversationHistory, User

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(
    input: ChatInput, 
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """
    Punto de entrada principal para la conversación.
    Analiza el mensaje, extrae fechas, clasifica la intención y genera una respuesta.
    Redirige a servicios específicos según la intención detectada.
    """
    try:
        # 1. Extraer fechas con Duckling
        fechas_detectadas = await duckling_service.extract_dates_with_duckling(input.message)

        # Usar el historial persistente y optimizado
        llm_output = await llm_service.generate_response(
            input.message,
            fechas_detectadas,
            conversation_history=None,  # Se obtiene automáticamente en llm_service
            user_id=current_user.username,
            db=db
        )
        intencion = llm_output.get("intencion", "CONVERSACION_GENERAL")
        respuesta_llm = llm_output.get("respuesta", "Lo siento, no pude generar una respuesta.")
        emocion = llm_output.get("emocion", "Neutra") # Extraer la emoción

        print(f"[DEBUG] Intención detectada por LLM: {intencion}, Emoción: {emocion}")

        # 3. Redirigir acciones según la intención
        if intencion == "RECORDATORIO":
            if fechas_detectadas:
                primera_fecha_str = fechas_detectadas[0]["value"]["value"]
                try:
                    from dateutil import parser
                    primera_fecha = parser.parse(primera_fecha_str)
                except ValueError:
                    print(f"[DEBUG] No se pudo parsear la fecha: {primera_fecha_str}")
                    primera_fecha = None

                if primera_fecha:
                    reminder_service.add_reminder(
                        db=db,
                        user_id=current_user.username,
                        text=input.message,
                        reminder_time=primera_fecha
                    )
                print(f"[DEBUG] Recordatorio guardado para {current_user.username} en {primera_fecha}")
            else:
                print("[DEBUG] Intención RECORDATORIO pero sin fechas detectadas por Duckling.")
                respuesta_llm += " Para guardar un recordatorio, necesito una fecha y hora específicas."

        elif intencion == "EMERGENCIA":
            emergency_service.registrar_emergencia(
                db=db, 
                user_id=current_user.username,
                tipo_emergencia="Solicitud de emergencia",
                mensaje_opcional=input.message
            )
            print(f"[DEBUG] Emergencia registrada para {current_user.username}")
            respuesta_llm = "¡Alerta de emergencia activada! Ya he notificado a los contactos de emergencia. Mantén la calma."

        elif intencion == "SALUD":
            health_service.save_health_data(db=db, user_id=current_user.username, parameter="unknown", value=input.message)
            print(f"[DEBUG] Intención SALUD detectada. Lógica de guardado de salud iría aquí.")

        # INTEGRACIÓN DE WEATHERAPI
        elif intencion == "INFORMACION":
            lower_msg = input.message.lower()
            info_extra = ""
            if any(word in lower_msg for word in ["clima", "tiempo", "temperatura", "weather"]):
                weather_info = await llm_service.get_weather_info_from_llm(current_user.city or "Chile")
                if weather_info:
                    info_extra += f"\n\nInformación del clima para {weather_info['city']}, {weather_info['country']}: {weather_info['temp_c']}°C, {weather_info['condition']}"
            if any(word in lower_msg for word in ["noticia", "noticias", "news"]):
                news_info = await llm_service.get_news_info_from_llm(input.message)
                if news_info and len(news_info) > 0:
                    info_extra += "\n\nÚltimas noticias relevantes:\n"
                    for noticia in news_info[:3]:
                        info_extra += f"- {noticia['title']}: {noticia['url']}\n"
            # Si el LLM responde que no puede, pero sí hay info, solo mostrar la info
            if info_extra and ("no puedo" in respuesta_llm.lower() or "no puedo proporcionar" in respuesta_llm.lower()):
                respuesta_llm = info_extra.strip()
            elif info_extra:
                respuesta_llm += info_extra

        # 4. Guardar el historial de la conversación
        db.add(ConversationHistory(user_id=current_user.username, role="user", content=input.message))
        db.add(ConversationHistory(user_id=current_user.username, role="assistant", content=respuesta_llm))
        db.commit()

        # 5. Devolver la respuesta al frontend
        return {"respuesta": respuesta_llm, "fechas_detectadas": fechas_detectadas, "emocion": emocion}

    except Exception as e:
        print(f"[❌ CHAT_ENDPOINT ERROR] {e}")
        raise HTTPException(
            status_code=500, detail="Ocurrió un error interno en el chat."
        )
