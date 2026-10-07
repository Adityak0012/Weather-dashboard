import { motion } from 'framer-motion';
import { Sunrise, Sunset } from 'lucide-react';
import { useNow } from '../hooks/hooks.js';
import { cityNow, clock, duration } from '../lib/time.js';

// Sun path drawn as a half ellipse; the sun dot sits at the current progress.
const W = 240;
const H = 96;
const R_X = 100;
const R_Y = 76;
const CX = W / 2;
const BASE = 88;

export default function SunCard({ daily, offset }) {
  useNow(60 * 1000); // update every minute
  const today = daily[0];
  const tomorrow = daily[1];
  const now = cityNow(offset);
  const rise = today.sunrise.getTime();
  const set = today.sunset.getTime();
  const t = now.getTime();
  const progress = Math.min(Math.max((t - rise) / (set - rise), 0), 1);
  const isDay = t >= rise && t <= set;

  const angle = Math.PI * (1 - progress);
  const sx = CX + R_X * Math.cos(angle);
  const sy = BASE - R_Y * Math.sin(angle);

  let status;
  if (t < rise) status = `Sunrise in ${duration(rise - t)}`;
  else if (isDay) status = `Sunset in ${duration(set - t)}`;
  else status = tomorrow ? `Sunrise in ${duration(tomorrow.sunrise.getTime() - t)}` : 'The sun has set';

  const arc = `M ${CX - R_X},${BASE} A ${R_X},${R_Y} 0 0 1 ${CX + R_X},${BASE}`;

  return (
    <section className="card sun" aria-labelledby="sun-title">
      <div className="card-head">
        <h2 id="sun-title" className="card-title">Sun</h2>
        <span className="card-hint">{duration(set - rise)} of daylight</span>
      </div>
      <svg className="sun-arc" viewBox={`0 0 ${W} ${H + 4}`} role="img" aria-label={status}>
        <defs>
          <linearGradient id="sun-grad" x1="0" x2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity=".2" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d={arc} fill="none" stroke="var(--line-strong)" strokeWidth="1.5" strokeDasharray="3 5" />
        <motion.path
          d={arc}
          fill="none"
          stroke="url(#sun-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <line x1="8" x2={W - 8} y1={BASE} y2={BASE} stroke="var(--line)" />
        {isDay && (
          <motion.g initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9, type: 'spring', stiffness: 260, damping: 18 }} style={{ transformOrigin: `${sx}px ${sy}px` }}>
            <circle cx={sx} cy={sy} r="13" fill="var(--accent)" opacity=".18" />
            <circle cx={sx} cy={sy} r="7" fill="var(--accent)" />
          </motion.g>
        )}
      </svg>
      <p className="sun-status">{status}</p>
      <div className="sun-times">
        <span><Sunrise size={16} aria-hidden="true" /> <small>Sunrise</small> <strong>{clock(today.sunrise)}</strong></span>
        <span><Sunset size={16} aria-hidden="true" /> <small>Sunset</small> <strong>{clock(today.sunset)}</strong></span>
      </div>
    </section>
  );
}
