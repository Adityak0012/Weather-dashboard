// Time helpers.
//
// Open-Meteo (with timezone=auto) returns *local* ISO strings without an
// offset, e.g. "2026-10-07T20:00". We treat them as if they were UTC, so a
// Date built from them can be read with the getUTC* methods to get the
// city's wall-clock time — independent of the visitor's own time zone.

export const parseLocal = (iso) => new Date(`${iso}Z`);

/** The current wall-clock time in a city, as a "fake UTC" Date. */
export const cityNow = (offsetSeconds) => new Date(Date.now() + offsetSeconds * 1000);

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function clock(d, withMinutes = true) {
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const h12 = h % 12 || 12;
  const ap = h < 12 ? 'AM' : 'PM';
  return withMinutes ? `${h12}:${m} ${ap}` : `${h12} ${ap}`;
}

export const dayShort = (d) => DAYS[d.getUTCDay()];
export const longDate = (d) => `${DAYS_LONG[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;

export function duration(ms) {
  const mins = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function timeAgo(ts, now = Date.now()) {
  const s = Math.round((now - ts) / 1000);
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return `${h} h ago`;
}

export function utcOffsetLabel(offsetSeconds) {
  const sign = offsetSeconds >= 0 ? '+' : '−';
  const abs = Math.abs(offsetSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.round((abs % 3600) / 60);
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}
