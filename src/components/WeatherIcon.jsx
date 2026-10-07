import { motion } from 'framer-motion';
import {
  Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Sun,
} from 'lucide-react';
import { describeCode } from '../lib/weatherCodes.js';

const ICONS = {
  clear: { day: Sun, night: Moon, tone: 'sun' },
  partly: { day: CloudSun, night: CloudMoon, tone: 'cloud' },
  cloudy: { day: Cloud, night: Cloud, tone: 'cloud' },
  fog: { day: CloudFog, night: CloudFog, tone: 'cloud' },
  drizzle: { day: CloudDrizzle, night: CloudDrizzle, tone: 'rain' },
  rain: { day: CloudRain, night: CloudRain, tone: 'rain' },
  snow: { day: CloudSnow, night: CloudSnow, tone: 'snow' },
  storm: { day: CloudLightning, night: CloudLightning, tone: 'storm' },
};

/**
 * Weather icon for a WMO code. `animated` adds a gentle idle motion,
 * used for the large hero icon only.
 */
export default function WeatherIcon({ code, isDay = true, size = 24, animated = false, className = '' }) {
  const { icon } = describeCode(code);
  const def = ICONS[icon] ?? ICONS.cloudy;
  const Icon = isDay ? def.day : def.night;
  const tone = icon === 'clear' && !isDay ? 'moon' : def.tone;
  const cls = `wx-icon wx-icon--${tone} ${className}`;

  if (!animated) {
    return <Icon className={cls} size={size} strokeWidth={1.6} aria-hidden="true" />;
  }

  const idle = icon === 'clear' && isDay
    ? { rotate: [0, 360], transition: { duration: 60, ease: 'linear', repeat: Infinity } }
    : { y: [0, -6, 0], transition: { duration: 6, ease: 'easeInOut', repeat: Infinity } };

  return (
    <motion.span className="wx-icon-wrap" animate={idle} aria-hidden="true">
      <Icon className={cls} size={size} strokeWidth={1.25} />
    </motion.span>
  );
}
