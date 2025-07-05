import requests
from typing import Optional, List, Dict

class GNewsService:
    BASE_URL = "https://gnews.io/api/v4/search"

    def __init__(self, api_key: str):
        self.api_key = api_key

    def get_news(self, query: str, lang: str = "es", max_results: int = 5) -> Optional[List[Dict]]:
        params = {
            "q": query,
            "lang": lang,
            "max": max_results,
            "token": self.api_key
        }
        print(f"[GNewsService] Requesting URL: {self.BASE_URL} with params {params}")
        response = requests.get(self.BASE_URL, params=params)
        print(f"[GNewsService] Response Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"[GNewsService] Raw API Response: {data}")
            # Filtrar solo los campos esenciales para el front: título y url
            if "articles" in data:
                filtered = [
                    {
                        "title": article.get("title"),
                        "url": article.get("url")
                    }
                    for article in data["articles"]
                ]
                return filtered
            else:
                print("[GNewsService] 'articles' key not found in response.")
        else:
            print(f"[GNewsService] API Error: {response.text}")
        return None
