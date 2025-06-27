import requests

BASE_URL = "http://localhost:8000"

# Datos de prueba
user_id = "usuario_demo"
tipo_emergencia = "caída"
mensaje_opcional = "El usuario cayó en la cocina y no responde."

# 1. Activar protocolo de emergencia
print("\n🚨 Activando protocolo de emergencia...")
data = {
    "user_id": user_id,
    "tipo_emergencia": tipo_emergencia,
    "mensaje_opcional": mensaje_opcional
}
response = requests.post(f"{BASE_URL}/emergency/", json=data)
print("Respuesta:", response.status_code, response.json())

# 2. Obtener historial de emergencias del usuario
print("\n📋 Consultando historial de emergencias...")
response = requests.get(f"{BASE_URL}/emergency/{user_id}")
print("Respuesta:", response.status_code, response.json())
