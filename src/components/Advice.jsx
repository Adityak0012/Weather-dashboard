import { motion } from 'framer-motion';
import {
  Clock, Footprints, GlassWater, Glasses, Shirt, ShieldAlert, Sparkles, Umbrella, UmbrellaOff,
} from 'lucide-react';
import { useMemo } from 'react';
import { buildAdvice } from '../lib/advice.js';

const ICONS = {
  umbrella: Umbrella,
  'umbrella-off': UmbrellaOff,
  shirt: Shirt,
  glasses: Glasses,
  water: GlassWater,
  mask: ShieldAlert,
  run: Footprints,
  clock: Clock,
};

const list = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } };
const card = {
  hidden: { opacity: 0, y: 18, rotateX: -12 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: { type: 'spring', stiffness: 160, damping: 18 } },
};

/** "What to wear & carry": practical tips generated from today's forecast. */
export default function Advice({ data, air, units, placeKey }) {
  const tips = useMemo(() => buildAdvice(data, air, units), [data, air, units]);

  return (
    <section className="card advice" aria-labelledby="advice-title">
      <div className="card-head">
        <h2 id="advice-title" className="card-title"><Sparkles size={15} aria-hidden="true" /> What to wear &amp; carry today</h2>
        <span className="card-hint">Based on the forecast for the next 12 hours</span>
      </div>
      <motion.ul key={placeKey} className="advice-grid" variants={list} initial="hidden" animate="show">
        {tips.map((t) => {
          const Icon = ICONS[t.icon] ?? Sparkles;
          return (
            <motion.li key={t.id} variants={card} whileHover={{ y: -4 }} className={`tip tip--${t.tone}`}>
              <motion.span
                className="tip-icon"
                whileHover={{ rotate: [0, -12, 10, 0], transition: { duration: 0.5 } }}
              >
                <Icon size={20} aria-hidden="true" />
              </motion.span>
              <div>
                <p className="tip-title">{t.title}</p>
                <p className="tip-detail">{t.detail}</p>
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
}
