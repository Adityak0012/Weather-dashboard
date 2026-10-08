import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AnimatePresence, motion } from 'framer-motion';
import { CloudRain, Droplets, Flame, MapPinned, Pause, Play, RotateCcw, Snowflake, Thermometer, Umbrella, Wind } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AttributionControl, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { fetchRadarFrames, fetchRegionWeather } from '../lib/api.js';
import { INDIA_REGIONS } from '../lib/regions.js';
import { speed, temp } from '../lib/units.js';
import { describeCode } from '../lib/weatherCodes.js';
import WeatherArt, { artKind } from './WeatherArt.jsx';

const INDIA_BOUNDS = [[7, 68.5], [36, 97.5]];

/** Colour for a temperature in °C (cool blues → warm reds). */
function tempColor(c) {
  if (c == null) return '#94a3b8';
  if (c < 5) return '#93c5fd';
  if (c < 15) return '#38bdf8';
  if (c < 22) return '#34d399';
  if (c < 28) return '#facc15';
  if (c < 34) return '#fb923c';
  return '#f87171';
}
function rainColor(p) {
  if (p >= 70) return '#3b82f6';
  if (p >= 40) return '#60a5fa';
  if (p >= 20) return '#93c5fd';
  return '#cbd5e1';
}

// Tiny flat versions of the weather art, as plain SVG strings for map markers
// (keeps the map bundle small — no server renderer needed).
const CLOUD = 'M16 50C9.4 50 6 45.5 6 40.5 6 35 10.5 31 16 31 17.5 23.5 24 18 32 18c8 0 14.5 5.6 15.6 13.2C53.5 31.6 58 36 58 41c0 5-4 9-9.5 9Z';
function miniArt(kind) {
  const cloud = (fill, t = '') => `<path d="${CLOUD}" fill="${fill}" ${t}/>`;
  const sun = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="#ffc94d" opacity=".25"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffc533"/>`;
  const moon = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#e3e8f6"/>`;
  const drops = '<path d="M22 54l-2 6M32 54l-2 6M42 54l-2 6" stroke="#60a5fa" stroke-width="3.5" stroke-linecap="round"/>';
  let body;
  switch (kind) {
    case 'clear-day': body = sun(32, 32, 16); break;
    case 'clear-night': body = moon(32, 32, 16); break;
    case 'partly-day': body = sun(24, 22, 12) + cloud('#e8eef6', 'transform="translate(8 10) scale(.84)"'); break;
    case 'partly-night': body = moon(24, 21, 11) + cloud('#e8eef6', 'transform="translate(8 10) scale(.84)"'); break;
    case 'fog': body = cloud('#b8c4d4', 'transform="translate(0 -6)"') + '<path d="M10 52h44M16 58h34" stroke="#dce4ee" stroke-width="3.5" stroke-linecap="round"/>'; break;
    case 'drizzle':
    case 'rain': body = cloud('#a9b6c8', 'transform="translate(0 -7)"') + drops; break;
    case 'snow': body = cloud('#e8eef6', 'transform="translate(0 -7)"') + '<g fill="#fff"><circle cx="22" cy="56" r="2.6"/><circle cx="32" cy="58" r="2.6"/><circle cx="42" cy="56" r="2.6"/></g>'; break;
    case 'storm': body = cloud('#6b7590', 'transform="translate(0 -7)"') + '<path d="M34 40l-8 12h6l-3 10 10-14h-6l3-8Z" fill="#ffc61a"/>'; break;
    default: body = cloud('#9aa8bc', 'transform="translate(-4 -9) scale(.78)"') + cloud('#e8eef6', 'transform="translate(6 4) scale(.86)"');
  }
  return `<svg width="20" height="20" viewBox="6 6 52 52" aria-hidden="true">${body}</svg>`;
}

const iconCache = new Map();
// Reuse the exact same L.divIcon object for the same look, so re-renders
// (e.g. each radar frame) don't rebuild markers or replay their pop-in.
const divIconCache = new Map();
function markerIcon(r, mode, units, active, index) {
  const label = mode === 'temp' ? `${temp(r.temp, units)}°` : `${r.pop}%`;
  const color = mode === 'temp' ? tempColor(r.temp) : rainColor(r.pop);
  const kind = artKind(describeCode(r.code).icon, r.isDay);
  const key = `${kind}|${label}|${color}|${active}`;
  if (!iconCache.has(key)) {
    const art = miniArt(kind);
    iconCache.set(key, `<div class="mk${active ? ' is-active' : ''}" style="--c:${color}">${art}<span>${label}</span></div>`);
  }
  const objKey = `${key}|${index}`;
  if (divIconCache.has(objKey)) return divIconCache.get(objKey);
  const icon = L.divIcon({
    className: 'mk-wrap',
    html: `<div class="mk-pop" style="animation-delay:${Math.min(index * 25, 800)}ms">${iconCache.get(key)}</div>`,
    iconSize: [66, 30],
    iconAnchor: [33, 15],
    popupAnchor: [0, -14],
  });
  divIconCache.set(objKey, icon);
  return icon;
}

/** Moves the map to a region and opens its popup when one is picked from the list. */
function FlyTo({ target, markers }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lon], Math.max(map.getZoom(), 6), { duration: 0.9 });
    const t = setTimeout(() => markers.current[target.state]?.openPopup(), 950);
    return () => clearTimeout(t);
  }, [target, map, markers]);
  return null;
}

function ResetView({ trigger }) {
  const map = useMap();
  useEffect(() => { if (trigger) map.flyToBounds(INDIA_BOUNDS, { duration: 0.8 }); }, [trigger, map]);
  return null;
}

const listAnim = { hidden: {}, show: { transition: { staggerChildren: 0.025 } } };
const rowAnim = { hidden: { opacity: 0, x: 12 }, show: { opacity: 1, x: 0 } };

export default function StateMap({ units, onOpen }) {
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState('loading');
  const [mode, setMode] = useState('temp');
  const [hover, setHover] = useState(null);
  const [focus, setFocus] = useState(null);
  const [reset, setReset] = useState(0);
  const markers = useRef({});

  // Rain radar (RainViewer): past ~2 hours of radar frames, played as an animation.
  const [radarOn, setRadarOn] = useState(false);
  const [radar, setRadar] = useState(null); // { host, frames: [{ time, path }] }
  const [radarErr, setRadarErr] = useState(false);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!radarOn || radar) return undefined;
    const ctrl = new AbortController();
    setRadarErr(false);
    fetchRadarFrames(ctrl.signal)
      .then((r) => { setRadar(r); setFrame(r.frames.length - 1); })
      .catch((e) => { if (e?.name !== 'AbortError') setRadarErr(true); });
    return () => ctrl.abort();
  }, [radarOn, radar]);

  useEffect(() => {
    if (!radarOn || !radar || !playing) return undefined;
    const id = setInterval(() => setFrame((f) => (f + 1) % radar.frames.length), 700);
    return () => clearInterval(id);
  }, [radarOn, radar, playing]);

  const load = useCallback(() => {
    const ctrl = new AbortController();
    setStatus('loading');
    fetchRegionWeather(INDIA_REGIONS, ctrl.signal)
      .then((r) => { setRows(r); setStatus('ready'); })
      .catch((e) => { if (e?.name !== 'AbortError') setStatus('error'); });
    return ctrl;
  }, []);
  useEffect(() => {
    const ctrl = load();
    return () => ctrl.abort();
  }, [load]);

  const sorted = useMemo(() => {
    if (!rows) return [];
    return [...rows].sort((a, b) => (mode === 'temp' ? b.temp - a.temp : b.pop - a.pop));
  }, [rows, mode]);

  const extremes = useMemo(() => {
    if (!rows?.length) return null;
    const by = (f) => [...rows].sort(f)[0];
    return {
      hot: by((a, b) => b.temp - a.temp),
      cold: by((a, b) => a.temp - b.temp),
      wet: by((a, b) => b.pop - a.pop),
    };
  }, [rows]);

  const pick = (r) => setFocus({ ...r, t: Date.now() });

  return (
    <section className="card statemap" aria-labelledby="map-title">
      <div className="card-head statemap-head">
        <div>
          <h2 id="map-title" className="card-title"><MapPinned size={15} aria-hidden="true" /> Weather across India</h2>
          <p className="card-hint">Live conditions in every state and union territory. Click a marker or a name.</p>
        </div>
        <div className="tabs" role="tablist" aria-label="Map shows">
          {[{ id: 'temp', label: 'Temperature', icon: Thermometer }, { id: 'rain', label: 'Rain chance', icon: Umbrella }].map((m) => (
            <button key={m.id} type="button" role="tab" aria-selected={mode === m.id} className={`tab ${mode === m.id ? 'is-active' : ''}`} onClick={() => setMode(m.id)}>
              {mode === m.id && <motion.span layoutId="map-tab" className="tab-bg" transition={{ type: 'spring', stiffness: 450, damping: 34 }} />}
              <m.icon size={14} aria-hidden="true" />
              <span className="tab-label">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="statemap-body">
        <div className="statemap-map">
          <MapContainer
            bounds={INDIA_BOUNDS}
            maxBounds={[[0, 60], [42, 106]]}
            minZoom={4}
            maxZoom={9}
            zoomSnap={0.25}
            scrollWheelZoom={false}
            attributionControl={false}
            className="leaflet-dark"
          >
            <AttributionControl prefix='<a href="https://leafletjs.com">Leaflet</a>' />
            {/* Free OpenStreetMap tiles (no API key), darkened with CSS to match the app */}
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              className="tiles-dark"
              maxZoom={19}
            />
            {radarOn && radar?.frames.map((fr, i) => (
              <TileLayer
                key={fr.path}
                url={`${radar.host}${fr.path}/256/{z}/{x}/{y}/2/1_1.png`}
                opacity={i === frame ? 0.8 : 0}
                maxNativeZoom={7}
                maxZoom={19}
                zIndex={10 + i}
                attribution='Radar &copy; <a href="https://www.rainviewer.com/">RainViewer</a>'
              />
            ))}
            {rows?.map((r, i) => (
              <Marker
                key={`${r.state}-${mode}`}
                position={[r.lat, r.lon]}
                icon={markerIcon(r, mode, units, hover === r.state || focus?.state === r.state, i)}
                ref={(m) => { if (m) markers.current[r.state] = m; }}
                eventHandlers={{ mouseover: () => setHover(r.state), mouseout: () => setHover(null) }}
                title={`${r.state}: ${temp(r.temp, units)}°`}
              >
                <Popup className="mk-popup" closeButton={false} maxWidth={240}>
                  <div className="pop">
                    <div className="pop-head">
                      <WeatherArt kind={artKind(describeCode(r.code).icon, r.isDay)} size={40} />
                      <div>
                        <strong>{r.state}</strong>
                        <small>{r.city}{r.ut ? ' · Union territory' : ''}</small>
                      </div>
                    </div>
                    <p className="pop-temp">{temp(r.temp, units)}°<span>{describeCode(r.code).label}</span></p>
                    <ul className="pop-list">
                      <li><Thermometer size={13} /> {temp(r.min, units)}° – {temp(r.max, units)}°</li>
                      <li><Umbrella size={13} /> {r.pop}% rain</li>
                      <li><Droplets size={13} /> {r.humidity}% humidity</li>
                      <li><Wind size={13} /> {speed(r.wind, units).value} {speed(r.wind, units).unit}</li>
                    </ul>
                    <button type="button" className="pop-btn" onClick={() => onOpen({ name: r.city, region: r.state, country: 'India', countryCode: 'IN', lat: r.lat, lon: r.lon })}>
                      Open full forecast
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
            <FlyTo target={focus} markers={markers} />
            <ResetView trigger={reset} />
          </MapContainer>

          <div className={`map-legend ${radarOn ? 'is-hidden' : ''}`} aria-hidden="true">
            {mode === 'temp' ? (
              <>
                <span>Cool</span>
                <i className="legend-bar legend-bar--temp" />
                <span>Hot</span>
              </>
            ) : (
              <>
                <span>Dry</span>
                <i className="legend-bar legend-bar--rain" />
                <span>Wet</span>
              </>
            )}
          </div>
          <div className="map-tools">
            <button
              type="button"
              className={`map-reset ${radarOn ? 'is-on' : ''}`}
              onClick={() => setRadarOn((v) => !v)}
              aria-pressed={radarOn}
            >
              <CloudRain size={14} /> Rain radar
            </button>
            <button type="button" className="map-reset" onClick={() => setReset((n) => n + 1)} aria-label="Show all of India">
              <RotateCcw size={14} /> All India
            </button>
          </div>

          <AnimatePresence>
            {radarOn && (
              <motion.div
                className="radar-bar"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              >
                {radarErr ? (
                  <span className="radar-msg">Radar isn’t available right now.</span>
                ) : !radar ? (
                  <span className="radar-msg"><span className="spin-dot spin-dot--sm" /> Loading radar…</span>
                ) : (
                  <>
                    <button type="button" className="radar-play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause radar' : 'Play radar'}>
                      {playing ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max={radar.frames.length - 1}
                      value={frame}
                      onChange={(e) => { setPlaying(false); setFrame(+e.target.value); }}
                      aria-label="Radar time"
                      className="radar-range"
                    />
                    <span className="radar-time">
                      {new Date(radar.frames[frame].time * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      {frame === radar.frames.length - 1 && <em>Latest</em>}
                    </span>
                    <span className="radar-legend" aria-hidden="true"><i /> Light → Heavy</span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {status !== 'ready' && (
              <motion.div className="map-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {status === 'loading' ? (
                  <span className="map-loading"><span className="spin-dot" /> Loading weather for 34 regions…</span>
                ) : (
                  <span className="map-loading">
                    Couldn’t load the map data.
                    <button type="button" className="pop-btn" onClick={load}>Try again</button>
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="statemap-side">
          {extremes && (
            <div className="extremes">
              <button type="button" className="extreme extreme--hot" onClick={() => pick(extremes.hot)}>
                <Flame size={16} aria-hidden="true" /><small>Hottest</small>
                <strong>{temp(extremes.hot.temp, units)}°</strong><span>{extremes.hot.state}</span>
              </button>
              <button type="button" className="extreme extreme--cold" onClick={() => pick(extremes.cold)}>
                <Snowflake size={16} aria-hidden="true" /><small>Coolest</small>
                <strong>{temp(extremes.cold.temp, units)}°</strong><span>{extremes.cold.state}</span>
              </button>
              <button type="button" className="extreme extreme--wet" onClick={() => pick(extremes.wet)}>
                <Umbrella size={16} aria-hidden="true" /><small>Wettest</small>
                <strong>{extremes.wet.pop}%</strong><span>{extremes.wet.state}</span>
              </button>
            </div>
          )}

          <motion.ul key={mode + (rows ? 'r' : '')} className="state-list" variants={listAnim} initial="hidden" animate="show">
            {sorted.map((r, i) => (
              <motion.li key={r.state} variants={rowAnim}>
                <button
                  type="button"
                  className={`state-row ${hover === r.state || focus?.state === r.state ? 'is-active' : ''}`}
                  onClick={() => pick(r)}
                  onMouseEnter={() => setHover(r.state)}
                  onMouseLeave={() => setHover(null)}
                >
                  <span className="state-rank">{i + 1}</span>
                  <WeatherArt kind={artKind(describeCode(r.code).icon, r.isDay)} size={24} />
                  <span className="state-name">{r.state}<small>{r.city}</small></span>
                  <span className="state-val" style={{ color: mode === 'temp' ? tempColor(r.temp) : rainColor(r.pop) }}>
                    {mode === 'temp' ? `${temp(r.temp, units)}°` : `${r.pop}%`}
                  </span>
                </button>
              </motion.li>
            ))}
          </motion.ul>
        </aside>
      </div>
    </section>
  );
}
