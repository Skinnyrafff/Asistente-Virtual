import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://192.168.1.90:8000';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos en milisegundos

export interface WeatherSummary {
  city: string;
  country: string;
  temp_c: number;
  condition: string;
  icon: string;
}

export interface NewsSummary {
  title: string;
  url: string;
  source_id?: string; // Añadido para que coincida con la propiedad usada en home.tsx
}

export function useExternalSummaries(city: string | null) {
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [news, setNews] = useState<NewsSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // let useCache = false;
      // let lastFetch = 0;
      // try {
      //   const storedWeather = await AsyncStorage.getItem('weather');
      //   const storedNews = await AsyncStorage.getItem('news');
      //   const storedTimestamp = await AsyncStorage.getItem('external_cache_timestamp');
      //   if (storedWeather) setWeather(JSON.parse(storedWeather));
      //   if (storedNews) setNews(JSON.parse(storedNews));
      //   if (storedTimestamp) lastFetch = parseInt(storedTimestamp, 10);
      //   if (Date.now() - lastFetch < CACHE_TTL) useCache = true;
      // } catch (e) { console.error("Error reading cache:", e); }
      // if (useCache) {
      //   setLoading(false);
      //   return;
      // }
      let weatherData = null;
      let newsData: NewsSummary[] = [];
      try {
        const location = city || 'Chile';
        const weatherRes = await fetch(`${API_BASE}/external/weather?location=${encodeURIComponent(location)}`);
        weatherData = await weatherRes.json();
        if (!weatherData || !weatherData.city) {
          const fallbackRes = await fetch(`${API_BASE}/external/weather?location=Chile`);
          weatherData = await fallbackRes.json();
        }
        if (weatherData && weatherData.city) {
          setWeather(weatherData);
          await AsyncStorage.setItem('weather', JSON.stringify(weatherData));
        }
      } catch (e) {
        console.error("Error fetching weather data:", e);
      }
      try {
        const newsRes = await fetch(`${API_BASE}/external/gnews?query=salud`);
        const rawNews = await newsRes.json();
        console.log('Raw News API Response:', rawNews); // Log raw response
        if (Array.isArray(rawNews) && rawNews.length > 0 && rawNews[0].title === "Sin noticias disponibles") {
          newsData = []; // It's the placeholder, so treat as empty
        } else if (Array.isArray(rawNews)) {
          newsData = rawNews.slice(0, 5);
        } else {
          newsData = [];
        }
        console.log('Processed News Data (before setNews):', newsData); // Log processed data
        if (!newsData.length) {
          const fallbackNewsRes = await fetch(`${API_BASE}/external/gnews?query=noticias`);
          const fallbackNews = await fallbackNewsRes.json();
          console.log('Raw Fallback News API Response:', fallbackNews); // Log raw fallback response
          if (Array.isArray(fallbackNews) && fallbackNews.length > 0 && fallbackNews[0].title === "Sin noticias disponibles") {
            newsData = []; // It's the placeholder, so treat as empty
          } else if (Array.isArray(fallbackNews)) {
            newsData = fallbackNews.slice(0, 5);
          } else {
            newsData = [];
          }
          console.log('Processed Fallback News Data (before setNews):', newsData); // Log processed fallback data
        }
        if (newsData.length) {
          setNews(newsData);
          await AsyncStorage.setItem('news', JSON.stringify(newsData));
        }
      } catch (e) {
        console.error("Error fetching news data:", e);
      }
      await AsyncStorage.setItem('external_cache_timestamp', Date.now().toString());
      setLoading(false);
    }
    fetchData();
  }, [city]);

  return { weather, news, loading };
}
