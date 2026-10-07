import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Droplets, Sun, Sunrise, Sunset, Umbrella, Wind } from 'lucide-react';
import { useState } from 'react';
import { clock, dayShort, longDate } from '../lib/time.js';
import { precip, speed, temp } from '../lib/units.js';
import { describeCode } from '../lib/weatherCodes.js';
import WeatherIcon from './WeatherIcon.jsx';

const list = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } };

export default function DailyForecast({ daily, current, units, placeKey }) {
  const [open, setOpen] = useState(null);
  const wMin = Math.min(...daily.map((d) => d.min));
  const wMax = Math.max(...daily.map((d) => d.max));
  const span = Math.max(wMax - wMin, 1);

  return (
    <section className="card daily" aria-labelledby="daily-title">
      <div className="card-head">
        <h2 id="daily-title" className="card-title">7-day forecast</h2>
        <span className="card-hint">Tap a day for details</span>
      </div>

      <motion.ul key={placeKey} className="daily-list" variants={list} initial="hidden" animate="show">
        {daily.map((d, i) => {
          const left = ((d.min - wMin) / span) * 100;
          const width = Math.max(((d.max - d.min) / span) * 100, 4);
          const isOpen = open === i;
          const nowPos = i === 0 ? ((current.temp - wMin) / span) * 100 : null;
          const rain = precip(d.precipSum, units);
          const wind = speed(d.windMax, units);
          return (
            <motion.li key={d.date.getTime()} variants={item} layout="position" className={`daily-item ${isOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className="daily-row"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`day-${i}`}
              >
                <span className="daily-day">{i === 0 ? 'Today' : dayShort(d.date)}</span>
                <span className="daily-icon">
                  <WeatherIcon code={d.code} size={22} />
                  <span className={`daily-pop ${d.pop >= 20 ? '' : 'is-hidden'}`}>{d.pop}%</span>
                </span>
                <span className="daily-min">{temp(d.min, units)}°</span>
                <span className="range" aria-hidden="true">
                  <motion.span
                    className="range-fill"
                    // The gradient spans the whole week's range, so a hot day shows warm colours.
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      originX: 0,
                      backgroundSize: `${(100 / width) * 100}% 100%`,
                      backgroundPosition: `${width >= 100 ? 0 : (left / (100 - width)) * 100}% 0`,
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 0.15 + i * 0.05, ease: 'easeOut' }}
                  />
                  {nowPos != null && <span className="range-now" style={{ left: `${Math.min(Math.max(nowPos, 0), 100)}%` }} />}
                </span>
                <span className="daily-max">{temp(d.max, units)}°</span>
                <motion.span className="daily-chev" animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={16} aria-hidden="true" />
                </motion.span>
                <span className="sr-only">{`${describeCode(d.code).label}, low ${temp(d.min, units)}, high ${temp(d.max, units)}`}</span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`day-${i}`}
                    className="daily-detail"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <div className="daily-detail-inner">
                      <p className="daily-detail-title">{longDate(d.date)} · {describeCode(d.code).label}</p>
                      <dl className="mini-grid">
                        <div><dt><Sunrise size={14} /> Sunrise</dt><dd>{clock(d.sunrise)}</dd></div>
                        <div><dt><Sunset size={14} /> Sunset</dt><dd>{clock(d.sunset)}</dd></div>
                        <div><dt><Umbrella size={14} /> Rain chance</dt><dd>{d.pop}%</dd></div>
                        <div><dt><Droplets size={14} /> Rainfall</dt><dd>{rain.value} {rain.unit}</dd></div>
                        <div><dt><Wind size={14} /> Max wind</dt><dd>{wind.value} {wind.unit}</dd></div>
                        <div><dt><Sun size={14} /> Max UV</dt><dd>{d.uvMax != null ? Math.round(d.uvMax) : '—'}</dd></div>
                      </dl>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
}
