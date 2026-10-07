import { motion, useReducedMotion } from 'framer-motion';
import { describeCode } from '../lib/weatherCodes.js';
import WeatherIcon from './WeatherIcon.jsx';

// Small decorative particles that bring the hero icon to life,
// chosen from the current conditions.

function Sparkles() {
  const stars = [
    { x: 8, y: 18, s: 14, d: 0 },
    { x: 84, y: 8, s: 10, d: 0.8 },
    { x: 92, y: 62, s: 12, d: 1.6 },
    { x: 18, y: 78, s: 9, d: 2.2 },
    { x: 60, y: -4, s: 8, d: 1.1 },
  ];
  return stars.map((st, i) => (
    <motion.svg
      key={i}
      className="art-sparkle"
      viewBox="0 0 24 24"
      style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0.2, 1, 0], scale: [0.4, 1, 0.7, 1, 0.4], rotate: [0, 90] }}
      transition={{ duration: 4, delay: st.d, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor" />
    </motion.svg>
  ));
}

function Drops({ snow = false }) {
  const items = [18, 34, 50, 66, 82, 42, 58];
  return items.map((x, i) => (
    <motion.span
      key={i}
      className={snow ? 'art-flake' : 'art-drop'}
      style={{ left: `${x}%` }}
      initial={{ y: 0, opacity: 0 }}
      animate={snow
        ? { y: [0, 70], x: [0, i % 2 ? 8 : -8, 0], opacity: [0, 1, 0] }
        : { y: [0, 60], opacity: [0, 1, 0] }}
      transition={{ duration: snow ? 2.6 : 0.9, delay: i * (snow ? 0.35 : 0.13), repeat: Infinity, ease: snow ? 'easeInOut' : 'easeIn' }}
    />
  ));
}

function Rays() {
  return (
    <motion.div
      className="art-rays"
      animate={{ rotate: 360, scale: [1, 1.06, 1] }}
      transition={{ rotate: { duration: 40, ease: 'linear', repeat: Infinity }, scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
    />
  );
}

function DriftCloud() {
  return (
    <motion.svg
      className="art-cloud"
      viewBox="0 0 64 40"
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: [-30, 30, -30], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M16 36a12 12 0 0 1 0-24 16 16 0 0 1 30 4 10 10 0 0 1 2 20H16Z" fill="currentColor" />
    </motion.svg>
  );
}

/** Animated weather illustration for the main card. */
export default function HeroArt({ code, isDay, size = 168, offset }) {
  const reduce = useReducedMotion();
  const { scene, icon } = describeCode(code);
  const clearNight = !isDay && (scene === 'clear' || icon === 'partly');

  return (
    <div className="art">
      {/* breathing glow */}
      <motion.div
        className="art-glow"
        style={offset ? { x: offset.gx, y: offset.gy } : undefined}
        animate={reduce ? undefined : { scale: [1, 1.15, 1], opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div className="art-stage" style={offset ? { x: offset.x, y: offset.y } : undefined}>
        {!reduce && scene === 'clear' && isDay && <Rays />}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.15 }}
        >
          <WeatherIcon code={code} isDay={isDay} size={size} animated />
        </motion.div>
        {!reduce && (
          <div className="art-fx" aria-hidden="true">
            {clearNight && <Sparkles />}
            {(scene === 'rain' || scene === 'storm') && <div className="art-drops"><Drops /></div>}
            {scene === 'snow' && <div className="art-drops"><Drops snow /></div>}
            {scene === 'cloudy' && <DriftCloud />}
            {scene === 'storm' && (
              <motion.div
                className="art-flash"
                animate={{ opacity: [0, 0, 0.9, 0, 0.6, 0] }}
                transition={{ duration: 5, times: [0, 0.8, 0.82, 0.86, 0.88, 0.95], repeat: Infinity }}
              />
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
