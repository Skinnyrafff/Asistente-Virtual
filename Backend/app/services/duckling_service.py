import httpx


async def extract_dates_with_duckling(text: str) -> list:
    print(f"[🔍 Duckling] Texto recibido: {text}")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8001/parse",
                data={
                    "text": text,
                    "locale": "es_ES",
                    "tz": "America/Santiago",
                    "dims": '["time"]',
                },
            )

            print(f"[🌐 Duckling HTTP] status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"[✅ Duckling] Resultado: {data}")
                return data

            print("[⚠️ Duckling] Respuesta no exitosa")
            return []

    except Exception as e:
        print(f"[❌ Duckling ERROR] {e}")
        return []
