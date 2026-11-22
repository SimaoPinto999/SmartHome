import { useQuery } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import { useEffect } from 'react';

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  description: string;
  icon: string;
  city: string;
}

function weatherCodeToInfo(code: number): { description: string; icon: string } {
  if (code === 0) return { description: 'Clear sky', icon: 'wb_sunny' };
  if (code <= 3) return { description: 'Mainly clear', icon: 'partly_cloudy_day' };
  if (code <= 48) return { description: 'Fog', icon: 'foggy' };
  if (code <= 67) return { description: 'Rain', icon: 'rainy' };
  if (code <= 77) return { description: 'Snow', icon: 'ac_unit' };
  if (code <= 82) return { description: 'Rain showers', icon: 'rainy' };
  return { description: 'Thunderstorm', icon: 'thunderstorm' };
}

const LISBON = { latitude: 38.7169, longitude: -9.1399 };

function getCoords(): Promise<{ latitude: number; longitude: number }> {
  return new Promise(resolve => {
    if (!('geolocation' in navigator)) {
      resolve(LISBON);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(LISBON),
      { timeout: 5000 },
    );
  });
}

async function fetchWeather(): Promise<WeatherData> {
  const { latitude, longitude } = await getCoords();
  const [weatherRes, geoRes] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weathercode&timezone=auto`),
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`),
  ]);

  if (!weatherRes.ok) {
   throw new Error(`Failed to fetch weather data: ${weatherRes.status}`);
  }
  if (!geoRes.ok) {
   throw new Error(`Failed to fetch location data: ${geoRes.status}`);
  }

  const [weatherJson, geoJson] = await Promise.all([weatherRes.json(), geoRes.json()]);
  const temp          = Math.round(weatherJson.current.temperature_2m);
  const feelsLike     = Math.round(weatherJson.current.apparent_temperature);
  const humidity      = Math.round(weatherJson.current.relative_humidity_2m);
  const windSpeed     = Math.round(weatherJson.current.wind_speed_10m);
  const precipitation = weatherJson.current.precipitation ?? 0;
  const { description, icon } = weatherCodeToInfo(weatherJson.current.weathercode);
  const city = geoJson.address?.city || geoJson.address?.town || geoJson.address?.village || geoJson.address?.county || 'Lisboa';
  return { temp, feelsLike, humidity, windSpeed, precipitation, description, icon, city };
}

export function useWeather() {
  const { showToast } = useToast();

  const query = useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    staleTime: 15 * 60 * 1000, // novos dados a cada 15 min
    retry: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (query.isError) showToast('Erro ao carregar tempo', 'error');
  }, [query.isError, showToast]);

  return query;
}