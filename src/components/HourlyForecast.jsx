import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Droplets } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { clock } from '../lib/time.js';
import { temp, tempValue } from '../lib/units.js';
import WeatherIcon from './WeatherIcon.jsx';

const COL = 68;      // px per hour
const H = 96;        // svg height
const PAD_T = 30;    // room for labels above the curve
const PAD_B = 12;

// Catmull-Rom spline -> cubic Bézier path for a smooth temperature curve.
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ` C ${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export default function HourlyForecast({ hourly, units, placeKey }) {
  const scroller = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const width = hourly.length * COL;

  const values = hourly.map((h) => tempValue(h.temp, units));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const pts = values.map((v, i) => [i * COL + COL / 2, PAD_T + (1 - (v - min) / span) * (H - PAD_T - PAD_B)]);
  const line = smoothPath(pts);
  const area = `${line} L ${pts.at(-1)[0]},${H} L ${pts[0][0]},${H} Z`;

  const updateEdges = () => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };
  useEffect(() => {
    scroller.current?.scrollTo({ left: 0 });
    updateEdges();
  }, [placeKey]);

  const page = (dir) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <section className="card hourly" aria-labelledby="hourly-title">
      <div className="card-head">
        <h2 id="hourly-title" className="card-title">Next 24 hours</h2>
        <div className="card-head-actions">
          <button type="button" className="icon-btn icon-btn--sm" onClick={() => page(-1)} disabled={edges.start} aria-label="Scroll to earlier hours"><ChevronLeft size={16} /></button>
          <button type="button" className="icon-btn icon-btn--sm" onClick={() => page(1)} disabled={edges.end} aria-label="Scroll to later hours"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className={`hourly-scroll ${edges.start ? '' : 'fade-start'} ${edges.end ? '' : 'fade-end'}`} ref={scroller} onScroll={updateEdges} tabIndex={0} aria-label="Hourly forecast, scroll horizontally">
        <div className="hourly-track" style={{ width }}>
          <svg className="hourly-chart" width={width} height={H} viewBox={`0 0 ${width} ${H}`} aria-hidden="true">
            <defs>
              <linearGradient id="hourly-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              key={`a-${placeKey}`}
              d={area}
              fill="url(#hourly-fill)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            <motion.path
              key={`l-${placeKey}`}
              d={line}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
            />
            {pts.map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r={i === 0 ? 4 : 2.5} fill={i === 0 ? 'var(--accent)' : 'var(--surface-solid)'} stroke="var(--accent)" strokeWidth="1.5" />
                <text x={x} y={y - 10} textAnchor="middle" className="hourly-temp">{temp(hourly[i].temp, units)}°</text>
              </g>
            ))}
          </svg>

          <ol className="hourly-cols">
            {hourly.map((h, i) => (
              <li key={h.time.getTime()} className={`hourly-col ${i === 0 ? 'is-now' : ''}`} style={{ width: COL }}>
                <span className="hourly-time">{i === 0 ? 'Now' : clock(h.time, false)}</span>
                <WeatherIcon code={h.code} isDay={h.isDay} size={22} />
                <span className={`hourly-pop ${h.pop >= 20 ? 'is-wet' : ''}`} title={`${h.pop}% chance of precipitation`}>
                  <Droplets size={11} aria-hidden="true" />{h.pop}%
                </span>
                <span className="sr-only">{`${clock(h.time, false)}: ${temp(h.temp, units)} degrees, ${h.pop}% chance of rain`}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
