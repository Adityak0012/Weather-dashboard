import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAirQuality, fetchForecast } from '../lib/api.js';

/** useState that is persisted to localStorage (fails silently if blocked). */
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
  }, [key, value]);
  return [value, setValue];
}

export function useDebounce(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** Re-renders every `ms` milliseconds and returns Date.now(). */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

const STALE_AFTER = 10 * 60 * 1000; // auto-refresh every 10 minutes

/**
 * Loads forecast + air quality for a place. Keeps showing the previous
 * data while a new request is in flight, so the UI never flashes empty.
 */
export function useWeather(place) {
  const [state, setState] = useState({ status: 'idle', place: null, data: null, air: null, error: null, updatedAt: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const ctrlRef = useRef(null);
  const updatedRef = useRef(0);

  const load = useCallback(async () => {
    if (!place) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setRefreshing(true);
    setState((s) => (s.data ? s : { ...s, status: 'loading', error: null }));
    try {
      const [data, air] = await Promise.all([
        fetchForecast(place, ctrl.signal),
        fetchAirQuality(place, ctrl.signal),
      ]);
      if (ctrl.signal.aborted) return;
      updatedRef.current = Date.now();
      setState({ status: 'success', place, data, air, error: null, updatedAt: updatedRef.current });
    } catch (err) {
      if (ctrl.signal.aborted && err?.name !== 'TimeoutError') return;
      const message = err?.name === 'TimeoutError' || err?.name === 'AbortError'
        ? 'The weather service took too long to respond.'
        : navigator.onLine === false
          ? 'You appear to be offline.'
          : err?.message || 'Something went wrong.';
      // `errorAt` lets the UI react to repeated failures with the same message.
      setState((s) => ({ ...s, status: s.data ? 'success' : 'error', error: message, errorAt: Date.now() }));
    } finally {
      if (ctrlRef.current === ctrl) setRefreshing(false);
    }
  }, [place?.lat, place?.lon, place?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
    return () => ctrlRef.current?.abort();
  }, [load]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible' && Date.now() - updatedRef.current > STALE_AFTER) load();
    };
    const id = setInterval(tick, 60 * 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [load]);

  return { ...state, refreshing, reload: load };
}
