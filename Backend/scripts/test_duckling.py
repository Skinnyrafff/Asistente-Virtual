import requests

url = "http://localhost:8001/parse"
text = "Tengo una cita el viernes a las 10"

response = requests.post(
    url,
    data={
        "text": text,
        "locale": "es_ES",
        "tz": "America/Santiago",
        "dims": '["time"]'
    }
)

print(f"Status: {response.status_code}")
print("Response:", response.text)
