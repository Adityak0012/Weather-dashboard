import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Droplets, Thermometer, Wind } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { clock } from '../lib/time.js';
import { speed, temp, tempValue } from '../lib/units.js';
import { describeCode } from '../lib/weatherCodes.js';
import WeatherIcon from './WeatherIcon.jsx';

const COL = 72;   // px per hour
const H = 120;    // chart height
const PAD_T = 34;
const PAD_B = 14;

const METRICS = [
  { id: 'temp', label: 'Temperature', icon: Thermometer },
  { id: 'rain', label: 'Rain', icon: Droplets },
  { id: 'wind', label: 'Wind', icon: Wind },
];

function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    d += ` C ${p1[0] + (p2[0] - p0[0]) * t},${p1[1] + (p2[1] - p0[1]) * t} ${p2[0] - (p3[0] - p1[0]) * t},${p2[1] - (p3[1] - p1[1]) * t} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function LineChart({ values, labels, color, gradId }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const pts = values.map((v, i) => [i * COL + COL / 2, PAD_T + (1 - (v - min) / span) * (H - PAD_T - PAD_B)]);
  const line = smoothPath(pts);
  const area = `${line} L ${pts.at(-1)[0]},${H} L ${pts[0][0]},${H} Z`;
  return (
    <>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill={`url(#${gradId})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} />
      <motion.path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: 'easeInOut' }} />
      {pts.map(([x, y], i) => (
        <motion.g key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.025 }}>
          <circle cx={x} cy={y} r="3" fill="var(--surface-solid)" stroke={color} strokeWidth="2" />
          <text x={x} y={y - 11} textAnchor="middle" className="hourly-temp">{labels[i]}</text>
        </motion.g>
      ))}
    </>
  );
}

function BarChart({ values, width }) {
  const maxH = H - PAD_T - 4;
  return (
    <>
      <line x1="0" x2={width} y1={H - 1} y2={H - 1} stroke="var(--line)" />
      {values.map((v, i) => {
        const h = Math.max((v / 100) * maxH, 2);
        const x = i * COL + COL / 2 - 11;
        return (
          <g key={i}>
            <motion.rect
              x={x} y={H - h} width="22" height={h} rx="6"
              fill={v >= 50 ? 'var(--rain)' : 'rgba(124,196,255,.45)'}
              style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ type: 'spring', stiffness: 160, damping: 18, delay: i * 0.025 }}
            />
            <motion.text x={x + 11} y={H - h - 8} textAnchor="middle" className="hourly-temp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.025 }}>
              {v}%
            </motion.text>
          </g>
        );
      })}
    </>
  );
}

/**
 * Hourly chart with three views (temperature, rain, wind) and a scrubber:
 * hover (or tap) any hour to see its details.
 */
export default function HourlyForecast({ hours, units, title, isNow, resetKey }) {
  const scroller = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const [metric, setMetric] = useState('temp');
  const [hover, setHover] = useState(null);
  const width = hours.length * COL;


  const updateEdges = () => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };
  useEffect(() => {
    scroller.current?.scrollTo({ left: 0 });
    setHover(null);
    updateEdges();
  }, [resetKey]);

  const pick = (clientX, target) => {
    const r = target.getBoundingClientRect();
    const i = Math.min(Math.max(Math.floor((clientX - r.left) / COL), 0), hours.length - 1);
    setHover(i);
  };

  const page = (dir) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: 'smooth' });
  const h = hover != null ? hours[hover] : null;
  const w = h ? speed(h.wind, units) : null;
  // Keep the tooltip inside the track near the edges.
  const tipAlign = hover == null ? 'center' : hover < 2 ? 'start' : hover > hours.length - 3 ? 'end' : 'center';

  let chart;
  if (metric === 'temp') {
    chart = <LineChart gradId="g-temp" color="var(--accent)" values={hours.map((x) => tempValue(x.temp, units))} labels={hours.map((x) => `${temp(x.temp, units)}°`)} />;
  } else if (metric === 'wind') {
    chart = <LineChart gradId="g-wind" color="#a5b4fc" values={hours.map((x) => x.wind ?? 0)} labels={hours.map((x) => speed(x.wind, units).value)} />;
  } else {
    chart = <BarChart width={width} values={hours.map((x) => x.pop)} />;
  }

  return (
    <section className="card hourly" aria-labelledby="hourly-title">
      <div className="card-head hourly-head">
        <h2 id="hourly-title" className="card-title">{title}</h2>
        <div className="tabs" role="tablist" aria-label="Chart type">
          {METRICS.map((m) => (
            <button key={m.id} type="button" role="tab" aria-selected={metric === m.id} className={`tab ${metric === m.id ? 'is-active' : ''}`} onClick={() => setMetric(m.id)}>
              {metric === m.id && <motion.span layoutId="hourly-tab" className="tab-bg" transition={{ type: 'spring', stiffness: 450, damping: 34 }} />}
              <m.icon size={14} aria-hidden="true" className="tab-icon" />
              <span className="tab-label">{m.label}</span>
            </button>
          ))}
        </div>
        <div className="card-head-actions">
          <button type="button" className="icon-btn icon-btn--sm" onClick={() => page(-1)} disabled={edges.start} aria-label="Scroll to earlier hours"><ChevronLeft size={16} /></button>
          <button type="button" className="icon-btn icon-btn--sm" onClick={() => page(1)} disabled={edges.end} aria-label="Scroll to later hours"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div
        className={`hourly-scroll ${edges.start ? '' : 'fade-start'} ${edges.end ? '' : 'fade-end'}`}
        ref={scroller}
        onScroll={updateEdges}
        tabIndex={0}
        aria-label="Hourly forecast. Hover or tap an hour for details."
      >
        <div
          className="hourly-track"
          style={{ width }}
          onPointerMove={(e) => { if (e.pointerType === 'mouse') pick(e.clientX, e.currentTarget); }}
          onPointerLeave={() => setHover(null)}
          onClick={(e) => pick(e.clientX, e.currentTarget)}
        >
          <AnimatePresence>
            {h && (
              <motion.div
                className={`scrub scrub--${tipAlign}`}
                initial={{ opacity: 0, x: hover * COL + COL / 2 }}
                animate={{ opacity: 1, x: hover * COL + COL / 2 }}
                exit={{ opacity: 0 }}
                transition={{ x: { type: 'spring', stiffness: 500, damping: 40 }, opacity: { duration: 0.15 } }}
              >
                <span className="scrub-line" />
                <div className="scrub-tip">
                  <strong>{clock(h.time, false)} · {temp(h.temp, units)}°</strong>
                  <span>{describeCode(h.code).label}</span>
                  <span>{h.pop}% rain · {w.value} {w.unit}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <svg className="hourly-chart" width={width} height={H} viewBox={`0 0 ${width} ${H}`} aria-hidden="true">
            <g key={`${metric}-${resetKey}-${units}`}>{chart}</g>
          </svg>

          <ol className="hourly-cols">
            {hours.map((x, i) => (
              <li key={x.time.getTime()} className={`hourly-col ${i === 0 && isNow ? 'is-now' : ''} ${hover === i ? 'is-hover' : ''}`} style={{ width: COL }}>
                <span className="hourly-time">{i === 0 && isNow ? 'Now' : clock(x.time, false)}</span>
                <motion.span animate={{ scale: hover === i ? 1.22 : 1, y: hover === i ? -3 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ display: 'grid' }}>
                  <WeatherIcon code={x.code} isDay={x.isDay} size={30} />
                </motion.span>
                <span className={`hourly-pop ${x.pop >= 20 ? 'is-wet' : ''}`}><Droplets size={11} aria-hidden="true" />{x.pop}%</span>
                <span className="sr-only">{`${clock(x.time, false)}: ${temp(x.temp, units)} degrees, ${x.pop}% chance of rain`}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
