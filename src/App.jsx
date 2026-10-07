import { motion, MotionConfig } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import AirQualityCard from './components/AirQualityCard.jsx';
import Background from './components/Background.jsx';
import CurrentCard from './components/CurrentCard.jsx';
import DailyForecast from './components/DailyForecast.jsx';
import Header from './components/Header.jsx';
import Highlights from './components/Highlights.jsx';
import HourlyForecast from './components/HourlyForecast.jsx';
import SavedDrawer from './components/SavedDrawer.jsx';
import { DashboardSkeleton, ErrorState, Toast, TopProgress } from './components/States.jsx';
import SunCard from './components/SunCard.jsx';
import { useLocalStorage, useWeather } from './hooks/hooks.js';
import { reverseGeocode } from './lib/api.js';
import { temp } from './lib/units.js';
import { sceneFor } from './lib/weatherCodes.js';

const DEFAULT_PLACE = { name: 'London', region: 'England', country: 'United Kingdom', countryCode: 'GB', lat: 51.5085, lon: -0.1257 };
const keyOf = (p) => (p ? `${p.lat.toFixed(3)},${p.lon.toFixed(3)}` : '');
const slim = ({ name, region = '', country = '', countryCode = '', lat, lon }) => ({ name, region, country, countryCode, lat, lon });

/** A place can be shared via ?lat=..&lon=..&name=.. */
function placeFromUrl() {
  const q = new URLSearchParams(window.location.search);
  const lat = parseFloat(q.get('lat'));
  const lon = parseFloat(q.get('lon'));
  if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
    return { name: q.get('name') || 'Shared location', region: q.get('region') || '', country: q.get('country') || '', countryCode: '', lat, lon };
  }
  return null;
}

function readLast() {
  try { return JSON.parse(localStorage.getItem('wn:last')); } catch { return null; }
}

const page = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const rise = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

export default function App() {
  const [units, setUnits] = useLocalStorage('wn:units', 'metric');
  const [saved, setSaved] = useLocalStorage('wn:saved', []);
  const [recents, setRecents] = useLocalStorage('wn:recents', []);
  const [place, setPlace] = useState(() => placeFromUrl() || readLast() || DEFAULT_PLACE);
  const [locating, setLocating] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const weather = useWeather(place);
  const shown = weather.place ?? place; // the place the visible data belongs to
  const data = weather.data;

  const notify = useCallback((text, tone = 'info') => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, tone });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const selectPlace = useCallback((p) => {
    const clean = slim(p);
    setPlace(clean);
    setRecents((r) => [clean, ...r.filter((x) => keyOf(x) !== keyOf(clean))].slice(0, 5));
  }, [setRecents]);

  // Remember the last place and keep the URL shareable.
  useEffect(() => {
    try { localStorage.setItem('wn:last', JSON.stringify(place)); } catch { /* ignore */ }
    const q = new URLSearchParams({ lat: place.lat.toFixed(4), lon: place.lon.toFixed(4), name: place.name });
    if (place.region) q.set('region', place.region);
    if (place.country) q.set('country', place.country);
    window.history.replaceState(null, '', `${window.location.pathname}?${q}`);
  }, [place]);

  // Tab title shows the live temperature.
  useEffect(() => {
    document.title = data
      ? `${temp(data.current.temp, units)}° ${shown.name} · WeatherNow`
      : 'WeatherNow — Live Weather Dashboard';
  }, [data, units, shown.name]);

  // Surface background refresh failures without wiping the dashboard.
  useEffect(() => {
    if (weather.error && weather.data) notify(`Couldn’t update: ${weather.error}`, 'error');
  }, [weather.errorAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const locate = useCallback((silent = false) => {
    if (!('geolocation' in navigator)) {
      if (!silent) notify('Location isn’t supported in this browser.', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const lat = +coords.latitude.toFixed(4);
        const lon = +coords.longitude.toFixed(4);
        const named = await reverseGeocode(lat, lon);
        setPlace({ ...(named ?? { name: 'My location', region: '', country: '', countryCode: '' }), lat, lon });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (silent) return;
        notify(err.code === 1
          ? 'Location permission was denied. You can still search for a city.'
          : 'Couldn’t get your location. Try searching instead.', 'error');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  }, [notify]);

  // First visit: if location permission is already granted, use it quietly.
  useEffect(() => {
    if (placeFromUrl() || readLast()) return;
    navigator.permissions?.query({ name: 'geolocation' })
      .then((s) => { if (s.state === 'granted') locate(true); })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isSaved = saved.some((p) => keyOf(p) === keyOf(shown));
  const toggleSave = () => {
    if (isSaved) {
      setSaved((s) => s.filter((p) => keyOf(p) !== keyOf(shown)));
      notify(`Removed ${shown.name} from saved cities`);
    } else {
      setSaved((s) => [...s, slim(shown)]);
      notify(`Saved ${shown.name}`);
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: `Weather in ${shown.name}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        notify('Link copied to clipboard');
      }
    } catch (e) {
      if (e?.name !== 'AbortError') notify('Couldn’t copy the link', 'error');
    }
  };

  const scene = data ? sceneFor(data.current.code, data.current.isDay) : 'clear-day';
  const placeKey = keyOf(shown);

  return (
    <MotionConfig reducedMotion="user">
      <Background scene={scene} />
      <TopProgress active={weather.refreshing} />
      <a className="skip-link" href="#main">Skip to forecast</a>

      <div className="shell">
        <Header
          units={units}
          onUnits={setUnits}
          onSelect={selectPlace}
          recents={recents}
          onClearRecents={() => setRecents([])}
          onLocate={() => locate(false)}
          locating={locating}
          savedCount={saved.length}
          onOpenSaved={() => setDrawer(true)}
        />

        <main id="main">
          {weather.status === 'error' && !data && <ErrorState message={weather.error} onRetry={weather.reload} />}
          {!data && weather.status !== 'error' && <DashboardSkeleton />}

          {data && (
            <motion.div className="grid" variants={page} initial="hidden" animate="show">
              <motion.div variants={rise} className="area-hero">
                <CurrentCard
                  place={shown}
                  data={data}
                  units={units}
                  saved={isSaved}
                  onToggleSave={toggleSave}
                  onShare={share}
                  onRefresh={weather.reload}
                  refreshing={weather.refreshing}
                  updatedAt={weather.updatedAt}
                />
              </motion.div>
              <motion.div variants={rise} className="side-stack area-side">
                <SunCard daily={data.daily} offset={data.offset} />
                <AirQualityCard air={weather.air} />
              </motion.div>
              <motion.div variants={rise} className="area-hourly">
                <HourlyForecast hourly={data.hourly} units={units} placeKey={placeKey} />
              </motion.div>
              <motion.div variants={rise} className="area-daily">
                <DailyForecast daily={data.daily} current={data.current} units={units} placeKey={placeKey} />
              </motion.div>
              <motion.div variants={rise} className="area-highlights">
                <Highlights current={data.current} units={units} placeKey={placeKey} />
              </motion.div>
            </motion.div>
          )}
        </main>

        <footer className="footer">
          <p>
            Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> (CC BY 4.0).
            Built by <a href="https://github.com/Adityak0012" target="_blank" rel="noreferrer">Aditya Kale</a>.
          </p>
          <p className="footer-keys"><kbd>/</kbd> search</p>
        </footer>
      </div>

      <SavedDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        saved={saved}
        setSaved={setSaved}
        units={units}
        onSelect={selectPlace}
        currentKey={placeKey}
      />
      <Toast toast={toast} />
    </MotionConfig>
  );
}
