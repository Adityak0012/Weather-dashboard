import { motion } from 'framer-motion';
import { describeCode } from '../lib/weatherCodes.js';
import WeatherArt, { artKind } from './WeatherArt.jsx';

/**
 * Weather icon for a WMO code, rendered as a shaded illustration.
 * `animated` adds idle motion (used for the large hero art).
 */
export default function WeatherIcon({ code, isDay = true, size = 24, animated = false, className = '' }) {
  const kind = artKind(describeCode(code).icon, isDay);

  if (!animated) return <WeatherArt kind={kind} size={size} className={className} />;

  return (
    <motion.span
      className="wx-icon-wrap"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
      aria-hidden="true"
    >
      <WeatherArt kind={kind} size={size} animated className={className} />
    </motion.span>
  );
}
