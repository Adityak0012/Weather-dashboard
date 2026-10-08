import {
  AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform,
} from 'framer-motion';
import {
  ArrowDown, ArrowUp, CornerUpLeft, Droplets, RefreshCw, Share2, Star, Sun as SunIcon, Sunrise, Sunset, Thermometer, Wind,
} from 'lucide-react';
import { useRef } from 'react';
import { useNow } from '../hooks/hooks.js';
import { nextHoursSummary } from '../lib/insights.js';
import { cityNow, clock, dayShort, longDate, timeAgo, utcOffsetLabel } from '../lib/time.js';
import { precip, speed, temp, tempValue } from '../lib/units.js';
import { describeCode } from '../lib/weatherCodes.js';
import AnimatedNumber from './AnimatedNumber.jsx';
import HeroArt from './HeroArt.jsx';
import WeatherIcon from './WeatherIcon.jsx';

const ease = [0.22, 1, 0.36, 1];
const letters = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const letter = { hidden: { y: '110%' }, show: { y: '0%', transition: { duration: 0.55, ease } } };

// Slide direction follows the day you move to (left/right).
const swap = {
  enter: (dir) => ({ opacity: 0, x: dir * 40, filter: 'blur(6px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease } },
  exit: (dir) => ({ opacity: 0, x: dir * -40, filter: 'blur(6px)', transition: { duration: 0.25 } }),
};

function LiveClock({ date }) {
  const h = date.getUTCHours();
  const m = String(date.getUTCMinutes()).padStart(2, '0');
  return (
    <time className="live-clock">
      {h % 12 || 12}
      <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>:</motion.span>
      {m} {h < 12 ? 'AM' : 'PM'}
    </time>
  );
}

function DayStrip({ daily, units, day, onDay }) {
  return (
    <div className="daystrip" role="tablist" aria-label="Choose a day">
      {daily.map((d, i) => (
        <motion.button
          key={d.date.getTime()}
          type="button"
          role="tab"
          aria-selected={day === i}
          className={`daychip ${day === i ? 'is-active' : ''}`}
          onClick={() => onDay(i)}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3 + i * 0.05, duration: 0.4, ease } }}
        >
          {day === i && <motion.span layoutId="daychip-bg" className="daychip-bg" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
          <span className="daychip-name">{i === 0 ? 'Today' : dayShort(d.date)}</span>
          <WeatherIcon code={d.code} size={34} />
          <span className="daychip-temps"><strong>{temp(d.max, units)}°</strong><span>{temp(d.min, units)}°</span></span>
          <span className={`daychip-pop ${d.pop >= 20 ? '' : 'is-dry'}`}><Droplets size={11} aria-hidden="true" />{d.pop}%</span>
        </motion.button>
      ))}
    </div>
  );
}

export default function Hero({
  place, data, units, saved, onToggleSave, onShare, onRefresh, refreshing, updatedAt, day, dayDir, onDay,
}) {
  const now = useNow(1000);
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { current: c, daily, hourly, offset } = data;
  const sel = daily[day];
  const local = cityNow(offset);
  const sub = [place.region, place.country].filter(Boolean).join(', ');
  const isToday = day === 0;

  const code = isToday ? c.code : sel.code;
  const isDay = isToday ? c.isDay : true;
  const scene = describeCode(code).scene;
  const glow = !isDay ? 'night' : scene === 'clear' ? 'sun' : scene === 'rain' || scene === 'storm' ? 'rain' : 'cloud';

  // Pointer spotlight + parallax
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 120, damping: 20 });
  const sy = useSpring(py, { stiffness: 120, damping: 20 });
  const artOffset = {
    x: useTransform(sx, [0, 1], [-18, 18]),
    y: useTransform(sy, [0, 1], [-12, 12]),
    gx: useTransform(sx, [0, 1], [12, -12]),
    gy: useTransform(sy, [0, 1], [10, -10]),
  };
  const onMove = (e) => {
    if (reduce || e.pointerType === 'touch') return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };

  // Scroll parallax: the art sinks and fades as you scroll past the hero.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const artScrollY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 110]);
  const artScrollO = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0.2]);

  const big = isToday ? c.temp : sel.max;
  const feelsDiff = Math.round(tempValue(c.feels, units) - tempValue(c.temp, units));
  const rain = precip(sel.precipSum, units);
  const wind = speed(sel.windMax, units);

  return (
    <section
      ref={ref}
      className={`card hero hero--${glow}`}
      aria-labelledby="hero-city"
      onPointerMove={onMove}
      onPointerLeave={() => { px.set(0.5); py.set(0.5); }}
    >

      <div className="hero-top">
        <motion.div key={`${place.lat},${place.lon}`} initial="hidden" animate="show">
          <motion.p className="eyebrow" variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
            <span className="live-dot" aria-hidden="true" />
            {longDate(local)} · <LiveClock date={local} />
            <span className="hero-tz">{utcOffsetLabel(offset)}</span>
          </motion.p>
          <motion.h1 id="hero-city" className="hero-city" variants={letters} aria-label={place.name}>
            {[...place.name].map((ch, i) => (
              <span key={i} className="hero-letter-mask" aria-hidden="true">
                <motion.span className="hero-letter" variants={letter}>{ch === ' ' ? ' ' : ch}</motion.span>
              </span>
            ))}
          </motion.h1>
          {sub && <motion.p className="hero-sub" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.3 } } }}>{sub}</motion.p>}
        </motion.div>

        <div className="hero-tools">
          <motion.button
            type="button"
            className={`icon-btn ${saved ? 'is-on' : ''}`}
            onClick={onToggleSave}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.88 }}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${place.name} from saved cities` : `Save ${place.name}`}
            title={saved ? 'Saved' : 'Save city'}
          >
            <motion.span key={saved ? 'on' : 'off'} initial={{ scale: 0.5, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }} style={{ display: 'grid' }}>
              <Star size={18} fill={saved ? 'currentColor' : 'none'} />
            </motion.span>
          </motion.button>
          <motion.button type="button" className="icon-btn" onClick={onShare} whileHover={{ y: -2 }} whileTap={{ scale: 0.9, rotate: -12 }} aria-label="Copy a link to this forecast" title="Share">
            <Share2 size={18} />
          </motion.button>
        </div>
      </div>

      <div className="hero-main">
        <AnimatePresence mode="wait" custom={dayDir} initial={false}>
          <motion.div key={`r-${day}`} className="hero-reading" custom={dayDir} variants={swap} initial="enter" animate="center" exit="exit">
            <p className="hero-when">
              {isToday ? 'Right now' : longDate(sel.date)}
              {!isToday && (
                <button type="button" className="back-now" onClick={() => onDay(0)}>
                  <CornerUpLeft size={13} /> Back to now
                </button>
              )}
            </p>
            <div className="hero-temp" aria-label={`${temp(big, units)} degrees`}>
              <AnimatedNumber value={Math.round(tempValue(big, units))} />
              <span className="hero-deg">°{units === 'imperial' ? 'F' : 'C'}</span>
            </div>
            <p className="hero-cond">{describeCode(code).label}</p>
            <div className="hero-chips">
              {isToday ? (
                <span className="chip" title="Apparent temperature">
                  <Thermometer size={13} aria-hidden="true" /> Feels {temp(c.feels, units)}°
                  {feelsDiff !== 0 && <em className={feelsDiff > 0 ? 'is-warm' : 'is-cool'}>{feelsDiff > 0 ? '+' : ''}{feelsDiff}°</em>}
                </span>
              ) : (
                <span className="chip"><Droplets size={13} aria-hidden="true" /> {sel.pop}% · {rain.value} {rain.unit}</span>
              )}
              <span className="chip"><ArrowUp size={13} aria-label="High" />{temp(sel.max, units)}°</span>
              <span className="chip"><ArrowDown size={13} aria-label="Low" />{temp(sel.min, units)}°</span>
              {!isToday && (
                <>
                  <span className="chip"><Wind size={13} aria-hidden="true" /> {wind.value} {wind.unit}</span>
                  <span className="chip"><SunIcon size={13} aria-hidden="true" /> UV {sel.uvMax != null ? Math.round(sel.uvMax) : '—'}</span>
                  <span className="chip"><Sunrise size={13} aria-hidden="true" /> {clock(sel.sunrise)}</span>
                  <span className="chip"><Sunset size={13} aria-hidden="true" /> {clock(sel.sunset)}</span>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <motion.div className="hero-art" style={{ y: artScrollY, opacity: artScrollO }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`a-${day}-${code}-${isDay}`}
              initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 140, damping: 16 } }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              style={{ width: '100%', height: '100%' }}
            >
              <HeroArt code={code} isDay={isDay} offset={reduce ? null : artOffset} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="hero-foot">
        <p className="hero-summary">{isToday ? nextHoursSummary(hourly, c) : `${dayShort(sel.date)}: ${sel.pop >= 50 ? 'take an umbrella' : sel.pop >= 25 ? 'a few showers possible' : 'looks dry'}, ${temp(sel.min, units)}° to ${temp(sel.max, units)}°.`}</p>
        <button type="button" className="text-btn refresh" onClick={onRefresh} disabled={refreshing} aria-label="Refresh weather">
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Updating…' : `Updated ${timeAgo(updatedAt, now)}`}
        </button>
      </div>

      <DayStrip daily={daily} units={units} day={day} onDay={onDay} />
    </section>
  );
}
