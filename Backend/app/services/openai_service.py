from openai import OpenAI
from app.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def get_openai_response(user_message: str) -> str:
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "Eres un asistente empático para personas mayores. Ayuda en salud, recordatorios y conversación.",
            },
            {"role": "user", "content": user_message},
        ],
    )
    return completion.choices[0].message.content
