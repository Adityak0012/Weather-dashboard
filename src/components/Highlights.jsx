import { motion } from 'framer-motion';
import { Droplet, Eye, Gauge, Navigation, Sun, Thermometer } from 'lucide-react';
import {
  feelsLabel, humidityLabel, pressureLabel, uvAdvice, uvLevel, visibilityLabel, windLabel,
} from '../lib/insights.js';
import { compass, distance, pressure, speed, temp } from '../lib/units.js';

const grid = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const tile = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

function Tile({ icon: Icon, label, value, unit, note, children }) {
  return (
    <motion.article className="tile" variants={tile} whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
      <h3 className="tile-label"><Icon size={15} aria-hidden="true" />{label}</h3>
      <p className="tile-value">{value}{unit && <span className="tile-unit">{unit}</span>}</p>
      {children}
      {note && <p className="tile-note">{note}</p>}
    </motion.article>
  );
}

function Meter({ ratio, className = '' }) {
  return (
    <div className={`meter ${className}`} aria-hidden="true">
      <motion.span
        className="meter-fill"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: Math.min(Math.max(ratio, 0), 1) }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

export default function Highlights({ current: c, units, placeKey }) {
  const wind = speed(c.wind, units);
  const gust = speed(c.gusts, units);
  const vis = distance(c.visibility, units);
  const pres = pressure(c.pressure, units);
  const uv = uvLevel(c.uv);
  const uvPos = Math.min((c.uv ?? 0) / 11, 1) * 100;

  return (
    <section className="highlights" aria-labelledby="hl-title">
      <h2 id="hl-title" className="section-title">Today’s highlights</h2>
      <motion.div key={placeKey} className="tiles" variants={grid} initial="hidden" animate="show">
        <Tile icon={Navigation} label="Wind" value={wind.value} unit={wind.unit} note={`${windLabel(c.wind)} · gusts ${gust.value} ${gust.unit}`}>
          <div className="compass" aria-label={`Wind from the ${compass(c.windDir)}`}>
            <span className="compass-n">N</span>
            <motion.span
              className="compass-needle"
              initial={{ rotate: 0 }}
              // Arrow points where the wind is blowing *to*.
              animate={{ rotate: ((c.windDir ?? 0) + 180) % 360 }}
              transition={{ type: 'spring', stiffness: 60, damping: 12 }}
            >
              <Navigation size={16} fill="currentColor" />
            </motion.span>
            <span className="compass-dir">{compass(c.windDir)}</span>
          </div>
        </Tile>

        <Tile icon={Droplet} label="Humidity" value={c.humidity ?? '—'} unit="%" note={`${humidityLabel(c.humidity)} · dew point ${temp(c.dewPoint, units)}°`}>
          <Meter ratio={(c.humidity ?? 0) / 100} className="meter--rain" />
        </Tile>

        <Tile icon={Sun} label="UV index" value={c.uv != null ? Math.round(c.uv) : '—'} unit={uv.label} note={uvAdvice(c.uv)}>
          <div className="uv-scale" aria-hidden="true">
            <motion.span className="uv-marker" initial={{ left: '0%' }} animate={{ left: `${uvPos}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
          </div>
        </Tile>

        <Tile icon={Thermometer} label="Feels like" value={`${temp(c.feels, units)}°`} note={feelsLabel(c.temp, c.feels)} />

        <Tile icon={Eye} label="Visibility" value={vis.value} unit={vis.unit} note={visibilityLabel(c.visibility)}>
          <Meter ratio={(c.visibility ?? 0) / 20000} />
        </Tile>

        <Tile icon={Gauge} label="Pressure" value={pres.value} unit={pres.unit} note={pressureLabel(c.pressure)}>
          <Meter ratio={((c.pressure ?? 1013) - 970) / 70} />
        </Tile>
      </motion.div>
    </section>
  );
}
