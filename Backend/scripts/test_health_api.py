import requests

BASE_URL = "http://127.0.0.1:8000"

user_id = "usuario_demo"
data = {
    "user_id": user_id,
    "parameter": "presion_arterial",
    "value": "130/85"
}


print("\n📝 Guardando dato de salud...")
res = requests.post(f"{BASE_URL}/health/", json=data)
print("Respuesta:", res.status_code, res.json())

print("\n📋 Obteniendo datos de salud...")
res = requests.get(f"{BASE_URL}/health/{user_id}")
print("Respuesta:", res.status_code, res.json())
