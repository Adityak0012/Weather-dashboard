// WMO weather interpretation codes, as returned by Open-Meteo.
// https://open-meteo.com/en/docs#weathervariables
//
// Each code maps to a human label, an icon key (see WeatherIcon.jsx)
// and a "scene" that drives the animated background.

const CODES = {
  0: { label: 'Clear sky', icon: 'clear', scene: 'clear' },
  1: { label: 'Mostly clear', icon: 'partly', scene: 'clear' },
  2: { label: 'Partly cloudy', icon: 'partly', scene: 'cloudy' },
  3: { label: 'Overcast', icon: 'cloudy', scene: 'cloudy' },
  45: { label: 'Fog', icon: 'fog', scene: 'fog' },
  48: { label: 'Freezing fog', icon: 'fog', scene: 'fog' },
  51: { label: 'Light drizzle', icon: 'drizzle', scene: 'rain' },
  53: { label: 'Drizzle', icon: 'drizzle', scene: 'rain' },
  55: { label: 'Heavy drizzle', icon: 'drizzle', scene: 'rain' },
  56: { label: 'Freezing drizzle', icon: 'drizzle', scene: 'rain' },
  57: { label: 'Freezing drizzle', icon: 'drizzle', scene: 'rain' },
  61: { label: 'Light rain', icon: 'rain', scene: 'rain' },
  63: { label: 'Rain', icon: 'rain', scene: 'rain' },
  65: { label: 'Heavy rain', icon: 'rain', scene: 'rain' },
  66: { label: 'Freezing rain', icon: 'rain', scene: 'rain' },
  67: { label: 'Freezing rain', icon: 'rain', scene: 'rain' },
  71: { label: 'Light snow', icon: 'snow', scene: 'snow' },
  73: { label: 'Snow', icon: 'snow', scene: 'snow' },
  75: { label: 'Heavy snow', icon: 'snow', scene: 'snow' },
  77: { label: 'Snow grains', icon: 'snow', scene: 'snow' },
  80: { label: 'Light showers', icon: 'rain', scene: 'rain' },
  81: { label: 'Showers', icon: 'rain', scene: 'rain' },
  82: { label: 'Violent showers', icon: 'rain', scene: 'rain' },
  85: { label: 'Snow showers', icon: 'snow', scene: 'snow' },
  86: { label: 'Heavy snow showers', icon: 'snow', scene: 'snow' },
  95: { label: 'Thunderstorm', icon: 'storm', scene: 'storm' },
  96: { label: 'Thunderstorm with hail', icon: 'storm', scene: 'storm' },
  99: { label: 'Severe thunderstorm', icon: 'storm', scene: 'storm' },
};

const FALLBACK = { label: 'Unknown', icon: 'cloudy', scene: 'cloudy' };

export function describeCode(code) {
  return CODES[code] ?? FALLBACK;
}

/** Background scene key, e.g. "clear-day", "rain-night". */
export function sceneFor(code, isDay) {
  return `${describeCode(code).scene}-${isDay ? 'day' : 'night'}`;
}
