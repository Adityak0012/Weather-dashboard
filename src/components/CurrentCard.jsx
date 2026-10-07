import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, RefreshCw, Share2, Star } from 'lucide-react';
import { useNow } from '../hooks/hooks.js';
import { nextHoursSummary } from '../lib/insights.js';
import { cityNow, clock, longDate, timeAgo, utcOffsetLabel } from '../lib/time.js';
import { temp, tempValue } from '../lib/units.js';
import { describeCode } from '../lib/weatherCodes.js';
import AnimatedNumber from './AnimatedNumber.jsx';
import WeatherIcon from './WeatherIcon.jsx';

export default function CurrentCard({
  place, data, units, saved, onToggleSave, onShare, onRefresh, refreshing, updatedAt,
}) {
  const now = useNow(1000);
  const { current: c, daily, hourly, offset } = data;
  const today = daily[0];
  const local = cityNow(offset);
  const sub = [place.region, place.country].filter(Boolean).join(', ');

  return (
    <section className="card hero" aria-labelledby="hero-city">
      <div className="hero-top">
        <div>
          <p className="eyebrow">
            <span className="live-dot" aria-hidden="true" />
            {longDate(local)} · <time>{clock(local)}</time>
            <span className="hero-tz">{utcOffsetLabel(offset)}</span>
          </p>
          <h1 id="hero-city" className="hero-city">{place.name}</h1>
          {sub && <p className="hero-sub">{sub}</p>}
        </div>
        <div className="hero-tools">
          <motion.button
            type="button"
            className={`icon-btn ${saved ? 'is-on' : ''}`}
            onClick={onToggleSave}
            whileTap={{ scale: 0.88 }}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${place.name} from saved cities` : `Save ${place.name}`}
            title={saved ? 'Saved' : 'Save city'}
          >
            <motion.span key={saved ? 'on' : 'off'} initial={{ scale: 0.6, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }} style={{ display: 'grid' }}>
              <Star size={18} fill={saved ? 'currentColor' : 'none'} />
            </motion.span>
          </motion.button>
          <motion.button type="button" className="icon-btn" onClick={onShare} whileTap={{ scale: 0.9 }} aria-label="Copy a link to this forecast" title="Share">
            <Share2 size={18} />
          </motion.button>
        </div>
      </div>

      <div className="hero-main">
        <div className="hero-reading">
          <div className="hero-temp" aria-label={`${temp(c.temp, units)} degrees`}>
            <AnimatedNumber value={Math.round(tempValue(c.temp, units))} />
            <span className="hero-deg">°{units === 'imperial' ? 'F' : 'C'}</span>
          </div>
          <p className="hero-cond">{describeCode(c.code).label}</p>
          <p className="hero-meta">
            <span>Feels like {temp(c.feels, units)}°</span>
            <span className="hero-hilo">
              <ArrowUp size={14} aria-label="High" />{temp(today.max, units)}°
              <ArrowDown size={14} aria-label="Low" />{temp(today.min, units)}°
            </span>
          </p>
        </div>
        <div className="hero-art">
          <WeatherIcon code={c.code} isDay={c.isDay} size={168} animated />
        </div>
      </div>

      <div className="hero-foot">
        <p className="hero-summary">{nextHoursSummary(hourly, c)}</p>
        <button type="button" className="text-btn refresh" onClick={onRefresh} disabled={refreshing} aria-label="Refresh weather">
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Updating…' : `Updated ${timeAgo(updatedAt, now)}`}
        </button>
      </div>
    </section>
  );
}
