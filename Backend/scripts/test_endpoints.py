import httpx
import asyncio

BASE_URL = "http://127.0.0.1:8000"

async def test_all_endpoints():
    print("\n--- Probando /health/status ---")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health/status")
        print(f"GET /health/status: {response.status_code} {response.json()}")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    print("\n--- Probando registro de usuario ---")
    register_data = {
        "username": "testuser",
        "pin": "1234",
        "age": 70,
        "city": "Madrid"
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BASE_URL}/auth/register", json=register_data)
        print(f"POST /auth/register: {response.status_code} {response.json()}")
        # Puede ser 200 si es nuevo, o 400 si ya existe
        assert response.status_code in [200, 400]

    print("\n--- Probando login de usuario ---")
    login_data = {
        "username": "testuser",
        "pin": "1234"
    }
    token = None
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"POST /auth/login: {response.status_code} {response.json()}")
        assert response.status_code == 200
        token = response.json().get("access_token")
        assert token is not None

    if token:
        headers = {"Authorization": f"Bearer {token}"}

        print("\n--- Probando /auth/me (requiere autenticación) ---")
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/auth/me", headers=headers)
            print(f"GET /auth/me: {response.status_code} {response.json()}")
            assert response.status_code == 200
            assert response.json()["username"] == "testuser"

        print("\n--- Probando /chat/ (requiere autenticación) ---")
        chat_data = {
            "message": "Hola, ¿cómo estás?",
            "user_id": "testuser",
            "conversation_history": []
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{BASE_URL}/chat/", json=chat_data, headers=headers)
            print(f"POST /chat/: {response.status_code} {response.json()}")
            assert response.status_code == 200
            assert "respuesta" in response.json()

        print("\n--- Probando /reminders/ (POST - requiere autenticación) ---")
        reminder_data = {
            "user_id": "testuser",
            "text": "Tomar pastillas",
            "datetime": "2025-12-25T10:00:00"
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{BASE_URL}/reminders/", json=reminder_data, headers=headers)
            print(f"POST /reminders/: {response.status_code} {response.json()}")
            assert response.status_code == 200
            assert "id" in response.json()

        print("\n--- Probando /reminders/{user_id} (GET - requiere autenticación) ---")
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/reminders/testuser", headers=headers)
            print(f"GET /reminders/testuser: {response.status_code} {response.json()}")
            assert response.status_code == 200
            assert isinstance(response.json(), list)

        print("\n--- Probando /health/ (POST - requiere autenticación) ---")
        health_data = {
            "user_id": "testuser",
            "parameter": "presion",
            "value": "120/80",
            "timestamp": "2025-06-28T14:30:00"
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{BASE_URL}/health/", json=health_data, headers=headers)
            print(f"POST /health/: {response.status_code} {response.json()}")
            assert response.status_code == 200
            assert "id" in response.json()

        print("\n--- Probando /health/{user_id} (GET - requiere autenticación) ---")
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/health/testuser", headers=headers)
            print(f"GET /health/testuser: {response.status_code} {response.json()}")
            assert response.status_code == 200
            assert isinstance(response.json(), list)

        print("\n--- Probando /emergency/ (POST - requiere autenticación) ---")
        emergency_data = {
            "user_id": "testuser",
            "tipo_emergencia": "Caída",
            "mensaje_opcional": "Me caí en el baño"
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{BASE_URL}/emergency/", json=emergency_data, headers=headers)
            print(f"POST /emergency/: {response.status_code} {response.json()}")
            assert response.status_code == 200
            assert "id" in response.json()

        print("\n--- Probando /emergency/{user_id} (GET - requiere autenticación) ---")
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/emergency/testuser", headers=headers)
            print(f"GET /emergency/testuser: {response.status_code} {response.json()}")
            assert response.status_code == 200
            assert isinstance(response.json(), list)

    else:
        print("No se pudo obtener el token de autenticación, saltando pruebas de endpoints autenticados.")

if __name__ == "__main__":
    asyncio.run(test_all_endpoints())