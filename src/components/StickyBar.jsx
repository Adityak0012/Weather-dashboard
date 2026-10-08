import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { temp } from '../lib/units.js';
import { describeCode } from '../lib/weatherCodes.js';
import WeatherIcon from './WeatherIcon.jsx';

/**
 * Compact pill that slides in once the big card scrolls away, plus a
 * reading-progress line at the very top of the page.
 */
export default function StickyBar({ place, current, units }) {
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  const [show, setShow] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => setShow(y > 460));

  return (
    <>
      <motion.div className="scroll-progress" style={{ scaleX: progress }} aria-hidden="true" />
      <AnimatePresence>
        {show && (
          <motion.button
            type="button"
            className="sticky-pill"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            initial={{ y: -80, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: -80, opacity: 0, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            whileHover={{ scale: 1.03 }}
            aria-label="Back to top"
          >
            <WeatherIcon code={current.code} isDay={current.isDay} size={28} />
            <strong>{place.name}</strong>
            <span className="sticky-temp">{temp(current.temp, units)}°</span>
            <span className="sticky-cond">{describeCode(current.code).label}</span>
            <ArrowUp size={15} className="sticky-up" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
