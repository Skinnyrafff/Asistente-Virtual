from fastapi import APIRouter, Query
from app.services.gnews_service import GNewsService
from app.services.weather_service import WeatherAPIService

# Las keys se pueden cargar desde variables de entorno o archivos seguros, aquí se usan directamente para pruebas
GNEWS_API_KEY = "1f7255a0ebcff7789b11a3e6128cf40f"
WEATHER_API_KEY = "6de1f0c88d044f2284e143213252205"

gnews_service = GNewsService(GNEWS_API_KEY)
weather_service = WeatherAPIService(WEATHER_API_KEY)

router = APIRouter()

@router.get("/gnews")
def get_news(query: str = Query(..., description="Término de búsqueda de noticias")):
    result = gnews_service.get_news(query)
    # Filtrar para asegurar que solo se devuelvan noticias con título y url válidos
    if result:
        filtered = [n for n in result if n.get("title") and n.get("url")]
        if filtered:
            return filtered
    return [{"title": "Sin noticias disponibles", "url": ""}]

@router.get("/weather")
def get_weather(location: str = Query(..., description="Ciudad o ubicación")):
    print(f"[Weather] Solicitando clima para: {location}")
    result = weather_service.get_weather(location)
    print(f"[Weather] Respuesta filtrada de la API externa: {result}")
    # Validar que existan los campos esenciales
    if result and result.get("city") and result.get("temp_c") is not None:
        print(f"[Weather] Devolviendo datos reales: {result}")
        return result
    else:
        print(f"[Weather] Fallback activado. Motivo: datos insuficientes o inválidos. Resultado: {result}")
        return {
            "city": "Sin datos",
            "country": "",
            "temp_c": None,
            "condition": "",
            "icon": ""
        }
