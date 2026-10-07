// Small, human-readable interpretations of the raw numbers.

import { clock } from './time.js';
import { describeCode } from './weatherCodes.js';

export function uvLevel(uv) {
  if (uv == null) return { label: '—', tone: 'muted' };
  if (uv < 3) return { label: 'Low', tone: 'good' };
  if (uv < 6) return { label: 'Moderate', tone: 'fair' };
  if (uv < 8) return { label: 'High', tone: 'warn' };
  if (uv < 11) return { label: 'Very high', tone: 'bad' };
  return { label: 'Extreme', tone: 'bad' };
}

export function uvAdvice(uv) {
  if (uv == null) return '';
  if (uv < 3) return 'No protection needed.';
  if (uv < 6) return 'Wear sunscreen if outside for long.';
  if (uv < 8) return 'Cover up and use SPF 30+.';
  return 'Avoid the midday sun.';
}

export function humidityLabel(h) {
  if (h == null) return '';
  if (h < 30) return 'Dry air';
  if (h < 60) return 'Comfortable';
  if (h < 80) return 'Humid';
  return 'Very humid';
}

export function visibilityLabel(m) {
  if (m == null) return '';
  if (m >= 10000) return 'Clear view';
  if (m >= 4000) return 'Good';
  if (m >= 1000) return 'Hazy';
  return 'Poor — take care';
}

export function pressureLabel(hpa) {
  if (hpa == null) return '';
  if (hpa < 1000) return 'Low — unsettled';
  if (hpa > 1022) return 'High — settled';
  return 'Normal';
}

export function windLabel(kmh) {
  if (kmh == null) return '';
  if (kmh < 6) return 'Calm';
  if (kmh < 20) return 'Light breeze';
  if (kmh < 39) return 'Moderate breeze';
  if (kmh < 62) return 'Strong wind';
  return 'Gale';
}

export function feelsLabel(temp, feels) {
  if (temp == null || feels == null) return '';
  const diff = feels - temp;
  if (diff >= 2) return 'Humidity makes it feel warmer.';
  if (diff <= -2) return 'Wind makes it feel cooler.';
  return 'Similar to the actual temperature.';
}

/** US EPA AQI bands. */
export function aqiLevel(aqi) {
  if (aqi == null) return { label: 'Unavailable', tone: 'muted', advice: '' };
  if (aqi <= 50) return { label: 'Good', tone: 'good', advice: 'Air quality is great for outdoor activity.' };
  if (aqi <= 100) return { label: 'Moderate', tone: 'fair', advice: 'Acceptable; very sensitive people should take it easy.' };
  if (aqi <= 150) return { label: 'Unhealthy for sensitive groups', tone: 'warn', advice: 'Sensitive groups should limit long outdoor exertion.' };
  if (aqi <= 200) return { label: 'Unhealthy', tone: 'bad', advice: 'Limit prolonged outdoor exertion.' };
  if (aqi <= 300) return { label: 'Very unhealthy', tone: 'bad', advice: 'Avoid outdoor exertion.' };
  return { label: 'Hazardous', tone: 'bad', advice: 'Stay indoors if you can.' };
}

/** One-line "what's coming" summary from the next 12 hours. */
export function nextHoursSummary(hourly, current) {
  const next = hourly.slice(1, 13);
  const scene = current ? describeCode(current.code).scene : '';
  if (scene === 'rain' || scene === 'storm' || scene === 'snow') {
    const what = scene === 'snow' ? 'Snow' : 'Rain';
    const dry = next.find((h) => h.pop < 30);
    return dry
      ? `${what} now, easing around ${clock(dry.time, false)}.`
      : `${what} is likely to continue for the next 12 hours.`;
  }
  const wet = next.find((h) => h.pop >= 50);
  if (wet) return `Rain likely around ${clock(wet.time, false)} (${wet.pop}% chance).`;
  const maybe = next.find((h) => h.pop >= 25);
  if (maybe) return `Small chance of rain around ${clock(maybe.time, false)}.`;
  return 'No rain expected in the next 12 hours.';
}
