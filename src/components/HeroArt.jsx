import { motion, useReducedMotion } from 'framer-motion';
import { describeCode } from '../lib/weatherCodes.js';
import WeatherIcon from './WeatherIcon.jsx';

// A few extra twinkles around the moon on clear nights.
function Sparkles() {
  const stars = [
    { x: 4, y: 20, s: 12, d: 0 },
    { x: 88, y: 6, s: 9, d: 0.8 },
    { x: 94, y: 64, s: 10, d: 1.6 },
    { x: 12, y: 82, s: 8, d: 2.2 },
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

/** Animated weather illustration for the main card, with pointer parallax. */
export default function HeroArt({ code, isDay, size = 200, offset }) {
  const reduce = useReducedMotion();
  const { scene } = describeCode(code);

  return (
    <div className="art">
      <motion.div
        className="art-glow"
        style={offset ? { x: offset.gx, y: offset.gy } : undefined}
        animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.6, 0.95, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="art-stage" style={offset ? { x: offset.x, y: offset.y } : undefined}>
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 15, delay: 0.15 }}
        >
          <WeatherIcon code={code} isDay={isDay} size={size} animated={!reduce} />
        </motion.div>
        {!reduce && (
          <div className="art-fx" aria-hidden="true">
            {!isDay && scene === 'clear' && <Sparkles />}
            {scene === 'storm' && (
              <motion.div
                className="art-flash"
                animate={{ opacity: [0, 0, 0.8, 0, 0.5, 0] }}
                transition={{ duration: 3, times: [0, 0.7, 0.75, 0.8, 0.85, 1], repeat: Infinity }}
              />
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
