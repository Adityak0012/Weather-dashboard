import { motion, MotionConfig } from 'framer-motion';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Advice from './components/Advice.jsx';
import Background from './components/Background.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import HourlyForecast from './components/HourlyForecast.jsx';
import SavedDrawer from './components/SavedDrawer.jsx';
import { DashboardSkeleton, ErrorState, Toast, TopProgress } from './components/States.jsx';
import StickyBar from './components/StickyBar.jsx';
import Widgets from './components/Widgets.jsx';

// The map (Leaflet) is loaded only when you scroll near it, keeping the first load fast.
const StateMap = lazy(() => import('./components/StateMap.jsx'));

function WhenNear({ children, fallback }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (near || !ref.current) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setNear(true); }, { rootMargin: '600px 0px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [near]);
  return <div ref={ref}>{near ? children : fallback}</div>;
}
import { useLocalStorage, useWeather } from './hooks/hooks.js';
import { reverseGeocode } from './lib/api.js';
import { dayShort } from './lib/time.js';
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
  const [day, setDay] = useState(0);        // 0 = today, 1–6 = upcoming days
  const [dayDir, setDayDir] = useState(1);  // slide direction for day changes
  const toastTimer = useRef(null);

  const weather = useWeather(place);
  const shown = weather.place ?? place; // the place the visible data belongs to
  const data = weather.data;

  const chooseDay = (i) => {
    setDayDir(i >= day ? 1 : -1);
    setDay(i);
  };
  // Go back to "now" whenever a new place loads.
  useEffect(() => { setDay(0); }, [weather.place?.lat, weather.place?.lon]);

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

  const placeKey = keyOf(shown);
  const selDay = data?.daily[day] ? day : 0;
  const scene = data
    ? (selDay === 0 ? sceneFor(data.current.code, data.current.isDay) : sceneFor(data.daily[selDay].code, true))
    : 'clear-day';
  // Hours shown in the chart: the next 24 for today, or that whole day otherwise.
  const hours = !data ? [] : selDay === 0
    ? data.hourly
    : data.hourlyAll.filter((h) => h.time.getUTCDate() === data.daily[selDay].date.getUTCDate()
        && h.time.getUTCMonth() === data.daily[selDay].date.getUTCMonth());

  return (
    <MotionConfig reducedMotion="user">
      <Background scene={scene} />
      <TopProgress active={weather.refreshing} />
      {data && <StickyBar place={shown} current={data.current} units={units} />}
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
            <motion.div className="stack" variants={page} initial="hidden" animate="show">
              <motion.div variants={rise}>
                <Hero
                  place={shown}
                  data={data}
                  units={units}
                  saved={isSaved}
                  onToggleSave={toggleSave}
                  onShare={share}
                  onRefresh={weather.reload}
                  refreshing={weather.refreshing}
                  updatedAt={weather.updatedAt}
                  day={selDay}
                  dayDir={dayDir}
                  onDay={chooseDay}
                />
              </motion.div>
              <motion.div variants={rise}>
                <Advice data={data} air={weather.air} units={units} placeKey={placeKey} />
              </motion.div>
              <motion.div variants={rise} className="min0">
                <HourlyForecast
                  hours={hours}
                  units={units}
                  isNow={selDay === 0}
                  title={selDay === 0 ? 'Next 24 hours' : `Hourly · ${dayShort(data.daily[selDay].date)}`}
                  resetKey={`${placeKey}-${selDay}`}
                />
              </motion.div>
              <motion.div variants={rise}>
                <Widgets data={data} air={weather.air} units={units} placeKey={placeKey} />
              </motion.div>
              <WhenNear fallback={<div className="card map-placeholder" />}>
                <Suspense fallback={<div className="card map-placeholder" />}>
                  <StateMap
                    units={units}
                    onOpen={(p) => { selectPlace(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  />
                </Suspense>
              </WhenNear>
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
