// Thin client for the free Open-Meteo APIs (no API key required).
//   Forecast:     https://open-meteo.com/en/docs
//   Air quality:  https://open-meteo.com/en/docs/air-quality-api
//   Geocoding:    https://open-meteo.com/en/docs/geocoding-api

import { parseLocal } from './time.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
// Free, key-less reverse geocoding used only for "Use my location".
const REVERSE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

const CURRENT = [
  'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day',
  'precipitation', 'weather_code', 'cloud_cover', 'surface_pressure',
  'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
  'visibility', 'uv_index', 'dew_point_2m',
].join(',');
const HOURLY = 'temperature_2m,precipitation_probability,weather_code,is_day';
const DAILY = [
  'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'sunrise', 'sunset',
  'uv_index_max', 'precipitation_probability_max', 'precipitation_sum', 'wind_speed_10m_max',
].join(',');

async function getJSON(url, { signal, timeout = 12000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new DOMException('Timeout', 'TimeoutError')), timeout);
  const onAbort = () => ctrl.abort(signal.reason);
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) {
      let reason = `Request failed (${res.status})`;
      try { reason = (await res.json()).reason || reason; } catch { /* ignore */ }
      throw new Error(reason);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/** City search for the autocomplete. */
export async function searchCities(query, signal) {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `${GEO_URL}?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
  const data = await getJSON(url, { signal, timeout: 8000 });
  return (data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    region: r.admin1 ?? '',
    country: r.country ?? '',
    countryCode: r.country_code ?? '',
    lat: r.latitude,
    lon: r.longitude,
  }));
}

/** Best-effort place name for coordinates; never throws. */
export async function reverseGeocode(lat, lon) {
  try {
    const d = await getJSON(`${REVERSE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=en`, { timeout: 6000 });
    const name = d.city || d.locality || d.principalSubdivision;
    if (!name) return null;
    return { name, region: d.principalSubdivision ?? '', country: d.countryName ?? '', countryCode: d.countryCode ?? '' };
  } catch {
    return null;
  }
}

/** Current conditions, next 24 hours and 7-day forecast, normalised. */
export async function fetchForecast({ lat, lon }, signal) {
  const url = `${FORECAST_URL}?latitude=${lat}&longitude=${lon}`
    + `&current=${CURRENT}&hourly=${HOURLY}&daily=${DAILY}`
    + '&timezone=auto&forecast_days=7';
  const d = await getJSON(url, { signal });

  const c = d.current;
  const now = parseLocal(c.time);
  const thisHour = new Date(now); thisHour.setUTCMinutes(0, 0, 0);

  let start = d.hourly.time.findIndex((t) => parseLocal(t) >= thisHour);
  if (start < 0) start = 0;
  const hourly = d.hourly.time.slice(start, start + 24).map((t, k) => {
    const i = start + k;
    return {
      time: parseLocal(t),
      temp: d.hourly.temperature_2m[i],
      pop: d.hourly.precipitation_probability?.[i] ?? 0,
      code: d.hourly.weather_code[i],
      isDay: !!d.hourly.is_day[i],
    };
  });

  const daily = d.daily.time.map((t, i) => ({
    date: parseLocal(t),
    code: d.daily.weather_code[i],
    max: d.daily.temperature_2m_max[i],
    min: d.daily.temperature_2m_min[i],
    sunrise: parseLocal(d.daily.sunrise[i]),
    sunset: parseLocal(d.daily.sunset[i]),
    uvMax: d.daily.uv_index_max?.[i] ?? null,
    pop: d.daily.precipitation_probability_max?.[i] ?? 0,
    precipSum: d.daily.precipitation_sum?.[i] ?? 0,
    windMax: d.daily.wind_speed_10m_max?.[i] ?? null,
  }));

  return {
    offset: d.utc_offset_seconds,
    timezone: d.timezone,
    current: {
      time: now,
      temp: c.temperature_2m,
      feels: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      dewPoint: c.dew_point_2m,
      isDay: !!c.is_day,
      code: c.weather_code,
      cloud: c.cloud_cover,
      precip: c.precipitation,
      pressure: c.surface_pressure,
      wind: c.wind_speed_10m,
      windDir: c.wind_direction_10m,
      gusts: c.wind_gusts_10m,
      visibility: c.visibility,
      uv: c.uv_index,
    },
    hourly,
    daily,
  };
}

/** Current air quality. Returns null when unavailable (it is optional). */
export async function fetchAirQuality({ lat, lon }, signal) {
  try {
    const url = `${AIR_URL}?latitude=${lat}&longitude=${lon}`
      + '&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide&timezone=auto';
    const d = await getJSON(url, { signal, timeout: 8000 });
    const c = d.current;
    if (c?.us_aqi == null) return null;
    return { aqi: c.us_aqi, pm25: c.pm2_5, pm10: c.pm10, o3: c.ozone, no2: c.nitrogen_dioxide };
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    return null;
  }
}

/** Current temperature + code for many places in one request (saved cities). */
export async function fetchSnapshots(places, signal) {
  if (!places.length) return [];
  const lats = places.map((p) => p.lat).join(',');
  const lons = places.map((p) => p.lon).join(',');
  const d = await getJSON(
    `${FORECAST_URL}?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code,is_day&timezone=auto`,
    { signal, timeout: 8000 },
  );
  const list = Array.isArray(d) ? d : [d];
  return list.map((x) => ({
    temp: x.current?.temperature_2m,
    code: x.current?.weather_code,
    isDay: !!x.current?.is_day,
  }));
}
