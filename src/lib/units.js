// All data is requested from the API in metric units and converted here,
// so switching units is instant and needs no extra network request.

export const toF = (c) => (c * 9) / 5 + 32;

export function temp(c, units) {
  if (c == null || Number.isNaN(c)) return '—';
  return Math.round(units === 'imperial' ? toF(c) : c);
}

export function tempValue(c, units) {
  return units === 'imperial' ? toF(c) : c;
}

export function speed(kmh, units) {
  if (kmh == null) return { value: '—', unit: '' };
  return units === 'imperial'
    ? { value: Math.round(kmh * 0.621371), unit: 'mph' }
    : { value: Math.round(kmh), unit: 'km/h' };
}

export function distance(meters, units) {
  if (meters == null) return { value: '—', unit: '' };
  if (units === 'imperial') {
    const mi = meters / 1609.34;
    return { value: mi >= 10 ? Math.round(mi) : mi.toFixed(1), unit: 'mi' };
  }
  const km = meters / 1000;
  return { value: km >= 10 ? Math.round(km) : km.toFixed(1), unit: 'km' };
}

export function pressure(hpa, units) {
  if (hpa == null) return { value: '—', unit: '' };
  return units === 'imperial'
    ? { value: (hpa * 0.02953).toFixed(2), unit: 'inHg' }
    : { value: Math.round(hpa), unit: 'hPa' };
}

export function precip(mm, units) {
  if (mm == null) return { value: '—', unit: '' };
  return units === 'imperial'
    ? { value: (mm / 25.4).toFixed(2), unit: 'in' }
    : { value: mm >= 10 ? Math.round(mm) : mm.toFixed(1), unit: 'mm' };
}

const DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
export const compass = (deg) => (deg == null ? '—' : DIRS[Math.round(deg / 22.5) % 16]);
