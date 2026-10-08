import { motion, useReducedMotion } from 'framer-motion';
import { Droplet, Eye, Gauge, Info, Navigation, Sun, Thermometer, Umbrella, Wind } from 'lucide-react';
import { useState } from 'react';
import {
  feelsLabel, humidityLabel, pressureLabel, uvAdvice, uvLevel, visibilityLabel, windLabel,
} from '../lib/insights.js';
import { compass, distance, precip, pressure, speed, temp } from '../lib/units.js';
import AirQualityCard from './AirQualityCard.jsx';
import SunCard from './SunCard.jsx';

const ease = [0.22, 1, 0.36, 1];
const grid = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 24, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease } } };

/** A tile that flips over on click to explain what the number means. */
function FlipTile({ icon: Icon, label, className = '', back, children }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <motion.div variants={item} className={`flip ${className}`}>
      <motion.div
        role="button"
        tabIndex={0}
        className="flip-inner"
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); } }}
        aria-pressed={flipped}
        aria-label={`${label}. ${flipped ? 'Show value' : 'What does this mean?'}`}
        animate={{ rotateY: flipped ? 180 : 0 }}
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      >
        <div className="flip-face tile">
          <span className="tile-label"><Icon size={15} aria-hidden="true" />{label}<Info size={13} className="flip-hint" aria-hidden="true" /></span>
          {children}
        </div>
        <div className="flip-face flip-back tile" aria-hidden={!flipped}>
          <span className="tile-label"><Icon size={15} aria-hidden="true" />{label}</span>
          <p className="flip-text">{back}</p>
          <span className="flip-tap">Tap to flip back</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Ring({ ratio, color, children, size = 92 }) {
  const r = 38;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,.08)" strokeWidth="9" fill="none" />
        <motion.circle
          cx="50" cy="50" r={r} stroke={color} strokeWidth="9" fill="none" strokeLinecap="round"
          transform="rotate(-90 50 50)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.min(Math.max(ratio, 0.02), 1) }}
          transition={{ duration: 1.2, ease }}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

function WaterGlobe({ ratio }) {
  const reduce = useReducedMotion();
  const level = 100 - Math.min(Math.max(ratio, 0), 1) * 100;
  const wave = 'M0 6 Q 25 0 50 6 T 100 6 T 150 6 T 200 6 V 120 H 0 Z';
  return (
    <div className="globe" aria-hidden="true">
      <motion.div className="globe-water" initial={{ y: '100%' }} animate={{ y: `${level}%` }} transition={{ duration: 1.4, ease }}>
        <motion.svg viewBox="0 0 200 120" preserveAspectRatio="none" className="globe-wave" animate={reduce ? undefined : { x: ['0%', '-50%'] }} transition={{ duration: 3, ease: 'linear', repeat: Infinity }}>
          <path d={wave} fill="rgba(124,196,255,.85)" />
        </motion.svg>
        <motion.svg viewBox="0 0 200 120" preserveAspectRatio="none" className="globe-wave globe-wave--back" animate={reduce ? undefined : { x: ['-50%', '0%'] }} transition={{ duration: 4.5, ease: 'linear', repeat: Infinity }}>
          <path d={wave} fill="rgba(124,196,255,.4)" />
        </motion.svg>
      </motion.div>
    </div>
  );
}

function Streaks({ kmh }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  const dur = Math.max(0.5, 3.2 - (kmh ?? 0) / 15); // faster wind → faster streaks
  return (
    <div className="streaks" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <motion.span
          key={i}
          className="streak"
          style={{ top: `${10 + i * 9.5}%`, width: `${18 + ((i * 37) % 30)}%` }}
          initial={{ x: '-120%', opacity: 0 }}
          animate={{ x: '520%', opacity: [0, 0.8, 0] }}
          transition={{ duration: dur + (i % 3) * 0.3, delay: (i * 0.37) % 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function Dial({ ratio }) {
  const angle = -90 + Math.min(Math.max(ratio, 0), 1) * 180;
  return (
    <svg className="dial" viewBox="0 0 120 70" aria-hidden="true">
      <defs>
        <linearGradient id="dial-g" x1="0" x2="1">
          <stop offset="0" stopColor="#7cc4ff" />
          <stop offset=".5" stopColor="#c9d6e8" />
          <stop offset="1" stopColor="#f5b544" />
        </linearGradient>
      </defs>
      <path d="M12 62 A48 48 0 0 1 108 62" stroke="url(#dial-g)" strokeWidth="6" fill="none" strokeLinecap="round" opacity=".9" />
      {Array.from({ length: 11 }, (_, i) => {
        const a = Math.PI - (i / 10) * Math.PI;
        return <line key={i} x1={60 + Math.cos(a) * 38} y1={62 - Math.sin(a) * 38} x2={60 + Math.cos(a) * 33} y2={62 - Math.sin(a) * 33} stroke="rgba(255,255,255,.25)" strokeWidth="1.5" />;
      })}
      <motion.g style={{ originX: '60px', originY: '62px' }} initial={{ rotate: -90 }} animate={{ rotate: angle }} transition={{ type: 'spring', stiffness: 50, damping: 9 }}>
        <line x1="60" y1="62" x2="60" y2="22" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      </motion.g>
      <circle cx="60" cy="62" r="5" fill="#fff" />
    </svg>
  );
}

function Thermo({ ratio }) {
  return (
    <div className="thermo" aria-hidden="true">
      <div className="thermo-tube">
        <motion.span className="thermo-fill" initial={{ scaleY: 0 }} animate={{ scaleY: Math.min(Math.max(ratio, 0.05), 1) }} transition={{ duration: 1.2, ease }} />
      </div>
      <span className="thermo-bulb" />
    </div>
  );
}

function FogBars({ ratio }) {
  // More haze bars appear as visibility drops.
  const haze = 1 - Math.min(Math.max(ratio, 0), 1);
  return (
    <div className="fogbars" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="fogbar"
          style={{ width: `${70 - i * 12}%` }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 0.15 + haze * 0.7 - i * 0.05, x: [0, i % 2 ? 8 : -8, 0] }}
          transition={{ opacity: { duration: 0.6, delay: i * 0.1 }, x: { duration: 6 + i, repeat: Infinity, ease: 'easeInOut' } }}
        />
      ))}
    </div>
  );
}

export default function Widgets({ data, air, units, placeKey }) {
  const { current: c, daily, hourly, offset } = data;
  const today = daily[0];
  const wind = speed(c.wind, units);
  const gust = speed(c.gusts, units);
  const vis = distance(c.visibility, units);
  const pres = pressure(c.pressure, units);
  const uv = uvLevel(c.uv);
  const rain = precip(today.precipSum, units);
  const uvColor = { good: '#4ade80', fair: '#facc15', warn: '#fb923c', bad: '#f87171' }[uv.tone] ?? '#c9d6e8';
  // Thermometer scale: -10°C … 45°C
  const feelsRatio = (c.feels + 10) / 55;
  const next12 = hourly.slice(0, 12);

  return (
    <section className="bento-wrap" aria-labelledby="hl-title">
      <div className="section-head">
        <h2 id="hl-title" className="section-title">Today’s details</h2>
        <span className="card-hint">Tap a tile to learn what it means</span>
      </div>
      <motion.div key={placeKey} className="bento" variants={grid} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.05 }}>
        {/* Wind — wide tile with live streaks */}
        <FlipTile
          icon={Wind}
          label="Wind"
          className="span-2"
          back={`${windLabel(c.wind)}. The wind is blowing from the ${compass(c.windDir)}, with gusts up to ${gust.value} ${gust.unit}. Streak speed in this tile follows the real wind speed.`}
        >
          <Streaks kmh={c.wind} />
          <div className="wind-body">
            <div>
              <p className="tile-value">{wind.value}<span className="tile-unit">{wind.unit}</span></p>
              <p className="tile-note">{windLabel(c.wind)} · gusts {gust.value} {gust.unit}</p>
            </div>
            <div className="compass compass--lg" aria-label={`Wind from the ${compass(c.windDir)}`}>
              {['N', 'E', 'S', 'W'].map((d) => <span key={d} className={`compass-mark compass-mark--${d}`}>{d}</span>)}
              <motion.span
                className="compass-needle"
                initial={{ rotate: 0 }}
                animate={{ rotate: ((c.windDir ?? 0) + 180) % 360 }}
                transition={{ type: 'spring', stiffness: 40, damping: 7 }}
              >
                <Navigation size={22} fill="currentColor" />
              </motion.span>
            </div>
          </div>
        </FlipTile>

        <FlipTile icon={Sun} label="UV index" back={`${uvAdvice(c.uv)} The scale: 0–2 low, 3–5 moderate, 6–7 high, 8–10 very high, 11+ extreme. Today's peak is ${today.uvMax != null ? Math.round(today.uvMax) : '—'}.`}>
          <div className="tile-visual">
            <Ring ratio={(c.uv ?? 0) / 11} color={uvColor}>
              <strong>{c.uv != null ? Math.round(c.uv) : '—'}</strong>
              <small>{uv.label}</small>
            </Ring>
          </div>
        </FlipTile>

        <FlipTile icon={Droplet} label="Humidity" back={`Dew point is ${temp(c.dewPoint, units)}°. Above about 20°C it feels sticky and muggy; below about 10°C the air feels dry.`}>
          <div className="tile-split">
            <div>
              <p className="tile-value">{c.humidity ?? '—'}<span className="tile-unit">%</span></p>
              <p className="tile-note">{humidityLabel(c.humidity)}</p>
            </div>
            <WaterGlobe ratio={(c.humidity ?? 0) / 100} />
          </div>
        </FlipTile>

        <motion.div variants={item} className="span-2 bento-card"><SunCard daily={daily} offset={offset} /></motion.div>
        <motion.div variants={item} className="span-2 bento-card"><AirQualityCard air={air} /></motion.div>

        <FlipTile icon={Thermometer} label="Feels like" back={`${feelsLabel(c.temp, c.feels)} "Feels like" combines temperature, humidity and wind to show how it feels on your skin.`}>
          <div className="tile-split">
            <div>
              <p className="tile-value">{temp(c.feels, units)}°</p>
              <p className="tile-note">Actual {temp(c.temp, units)}°</p>
            </div>
            <Thermo ratio={feelsRatio} />
          </div>
        </FlipTile>

        <FlipTile icon={Eye} label="Visibility" back="How far you can clearly see. Under 1 km counts as fog; over 10 km is a clear view.">
          <p className="tile-value">{vis.value}<span className="tile-unit">{vis.unit}</span></p>
          <FogBars ratio={(c.visibility ?? 0) / 20000} />
          <p className="tile-note">{visibilityLabel(c.visibility)}</p>
        </FlipTile>

        <FlipTile icon={Gauge} label="Pressure" back="Normal sea-level pressure is about 1013 hPa. Falling pressure often brings clouds and rain; rising pressure usually means clearer, calmer weather.">
          <Dial ratio={((c.pressure ?? 1013) - 980) / 60} />
          <p className="tile-value tile-value--sm">{pres.value}<span className="tile-unit">{pres.unit}</span></p>
          <p className="tile-note">{pressureLabel(c.pressure)}</p>
        </FlipTile>

        <FlipTile icon={Umbrella} label="Rain today" back={`Chance of rain is the likelihood of at least a little rain in an hour. The bars show the next 12 hours. Expected total today: ${rain.value} ${rain.unit}.`}>
          <p className="tile-value">{today.pop}<span className="tile-unit">% · {rain.value} {rain.unit}</span></p>
          <div className="minibars" aria-hidden="true">
            {next12.map((h, i) => (
              <motion.span
                key={h.time.getTime()}
                className={`minibar ${h.pop >= 50 ? 'is-wet' : ''}`}
                style={{ height: `${Math.max(h.pop, 4)}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.2 + i * 0.04 }}
              />
            ))}
          </div>
          <p className="tile-note">Next 12 hours</p>
        </FlipTile>
      </motion.div>
    </section>
  );
}
