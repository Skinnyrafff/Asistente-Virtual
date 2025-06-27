import requests

BASE_URL = "http://127.0.0.1:8000"

# Datos iniciales
reminder_data = {
    "user_id": "default",
    "message": "Tomar medicamento a las 9 AM",
    "date": "2025-06-20T09:00:00",
    "full_json": {"origin": "test"}
}

# 1. POST - Crear un recordatorio
print("\n📝 Creando recordatorio...")
response = requests.post(f"{BASE_URL}/reminders/", json=reminder_data)
print("Respuesta:", response.status_code, response.json())
reminder_id = response.json()["id"]

# 2. GET - Obtener recordatorios del usuario
print("\n📋 Obteniendo recordatorios del usuario...")
response = requests.get(f"{BASE_URL}/reminders/{reminder_data['user_id']}")
print("Respuesta:", response.status_code, response.json())

# 3. PUT - Actualizar el recordatorio
print("\n✏️ Actualizando recordatorio...")
update_data = {
    "message": "Tomar medicamento después del almuerzo",
    "date": "2025-06-20T14:00:00",
    "full_json": {"origen": "actualizado"}
}
response = requests.put(f"{BASE_URL}/reminders/{reminder_id}", json=update_data)
print("Respuesta:", response.status_code, response.json())

# 4. DELETE - Eliminar el recordatorio
print("\n🗑️ Eliminando recordatorio...")
response = requests.delete(f"{BASE_URL}/reminders/{reminder_id}")
print("Respuesta:", response.status_code, response.json())
