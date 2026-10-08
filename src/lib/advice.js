// Turns the forecast into practical, plain-English tips.
// All temperatures here are °C (the raw API values); the UI converts for display.

import { clock } from './time.js';
import { temp } from './units.js';

/**
 * @returns {Array<{ id: string, icon: string, title: string, detail: string, tone: 'good'|'info'|'warn' }>}
 */
export function buildAdvice({ current: c, daily, hourly }, air, units = 'metric') {
  const today = daily[0];
  const next12 = hourly.slice(0, 12);
  const tips = [];

  // 1. Umbrella
  const wet = next12.find((h) => h.pop >= 50);
  const maybe = next12.find((h) => h.pop >= 25);
  if (wet || today.pop >= 60) {
    tips.push({
      id: 'umbrella', icon: 'umbrella', tone: 'warn', title: 'Carry an umbrella',
      detail: wet ? `Rain is likely around ${clock(wet.time, false)} (${wet.pop}% chance).` : `${today.pop}% chance of rain today.`,
    });
  } else if (maybe) {
    tips.push({
      id: 'umbrella', icon: 'umbrella', tone: 'info', title: 'Keep a small umbrella handy',
      detail: `A ${maybe.pop}% chance of a shower around ${clock(maybe.time, false)}.`,
    });
  } else {
    tips.push({ id: 'umbrella', icon: 'umbrella-off', tone: 'good', title: 'No umbrella needed', detail: 'Dry for the next 12 hours.' });
  }

  // 2. What to wear (by "feels like")
  const f = c.feels;
  let wear;
  if (f >= 32) wear = { title: 'Light, loose cotton', detail: 'It feels very hot. Choose light colours and breathable fabric.' };
  else if (f >= 25) wear = { title: 'T-shirt weather', detail: 'Warm and comfortable in light clothes.' };
  else if (f >= 18) wear = { title: 'Light layer', detail: 'A long-sleeve shirt or light jacket is enough.' };
  else if (f >= 10) wear = { title: 'Sweater or jacket', detail: 'It feels cool. Bring a warm layer.' };
  else wear = { title: 'Warm coat', detail: 'Cold out. A coat, scarf and closed shoes are a good idea.' };
  if ((c.wind ?? 0) >= 30) wear.detail += ' It’s windy, so a windcheater helps.';
  tips.push({ id: 'wear', icon: 'shirt', tone: 'info', ...wear });

  // 3. Sun protection
  const uv = today.uvMax ?? c.uv ?? 0;
  if (uv >= 6) {
    tips.push({ id: 'sun', icon: 'glasses', tone: 'warn', title: 'Sunscreen & sunglasses', detail: `UV peaks at ${Math.round(uv)} today. Avoid the midday sun.` });
  } else if (uv >= 3) {
    tips.push({ id: 'sun', icon: 'glasses', tone: 'info', title: 'Some sun protection', detail: `Moderate UV (up to ${Math.round(uv)}). Sunscreen for long outings.` });
  }

  // 4. Hydration / humidity
  if (f >= 30 || (c.humidity ?? 0) >= 80) {
    tips.push({
      id: 'water', icon: 'water', tone: 'info', title: 'Stay hydrated',
      detail: (c.humidity ?? 0) >= 80 ? `Muggy at ${c.humidity}% humidity. Carry a water bottle.` : 'Hot day. Carry a water bottle.',
    });
  }

  // 5. Air quality
  if (air?.aqi != null) {
    if (air.aqi > 150) tips.push({ id: 'air', icon: 'mask', tone: 'warn', title: 'Wear a mask outdoors', detail: `Air quality is unhealthy (AQI ${Math.round(air.aqi)}).` });
    else if (air.aqi > 100) tips.push({ id: 'air', icon: 'mask', tone: 'info', title: 'Go easy outdoors', detail: `AQI ${Math.round(air.aqi)}: fine for most, but sensitive people should limit exercise.` });
    else tips.push({ id: 'air', icon: 'run', tone: 'good', title: 'Good for a walk or run', detail: `Air quality is ${air.aqi <= 50 ? 'good' : 'acceptable'} (AQI ${Math.round(air.aqi)}).` });
  }

  // 6. Best time to be outside: daylight hour with low rain chance and the most pleasant temperature.
  const daylight = next12.filter((h) => h.isDay);
  if (daylight.length) {
    const score = (h) => h.pop * 0.6 + Math.abs(h.temp - 24) * 2;
    const best = [...daylight].sort((a, b) => score(a) - score(b))[0];
    tips.push({ id: 'best', icon: 'clock', tone: 'good', title: `Best time outside: ${clock(best.time, false)}`, detail: `Around ${temp(best.temp, units)}° with a ${best.pop}% chance of rain.` });
  }

  return tips.slice(0, 6);
}
