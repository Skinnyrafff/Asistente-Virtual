import requests
from typing import Optional, Dict

class WeatherAPIService:
    BASE_URL = "https://api.weatherapi.com/v1/current.json"

    def __init__(self, api_key: str):
        self.api_key = api_key

    def get_weather(self, location: str, lang: str = "es") -> Optional[Dict]:
        params = {
            "key": self.api_key,
            "q": location,
            "lang": lang
        }
        response = requests.get(self.BASE_URL, params=params)
        if response.status_code == 200:
            data = response.json()
            # Filtrar solo los campos esenciales para el front
            if "location" in data and "current" in data:
                filtered = {
                    "city": data["location"].get("name"),
                    "country": data["location"].get("country"),
                    "temp_c": data["current"].get("temp_c"),
                    "condition": data["current"]["condition"].get("text"),
                    "icon": data["current"]["condition"].get("icon")
                }
                return filtered
        return None
