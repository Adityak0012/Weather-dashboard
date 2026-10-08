import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

// "Deep ink" background: a still, near-black base with one large soft glow
// tinted by the weather, plus a faint dot grid. Nothing animates except a
// slow cross-fade when the conditions change, so it costs almost nothing
// to render and keeps scrolling smooth.

function seeded(n) {
  let s = n * 9301 + 49297;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

/** Light rain or snow, only while it is actually raining or snowing. */
function Precip({ kind }) {
  const items = useMemo(() => {
    const r = seeded(kind === 'snow' ? 11 : 3);
    return Array.from({ length: 28 }, (_, i) => ({ i, x: r() * 100, s: r(), d: r() }));
  }, [kind]);
  return (
    <div className="precip">
      {items.map((p) => (
        <span
          key={p.i}
          className={kind === 'snow' ? 'flake' : 'drop'}
          style={kind === 'snow'
            ? { left: `${p.x}%`, width: 2 + p.s * 3, height: 2 + p.s * 3, opacity: 0.2 + p.s * 0.35, animationDelay: `${-p.d * 10}s`, animationDuration: `${9 + (1 - p.s) * 6}s` }
            : { left: `${p.x}%`, height: 10 + p.s * 14, opacity: 0.08 + p.s * 0.18, animationDelay: `${-p.d * 2}s`, animationDuration: `${0.7 + (1 - p.s) * 0.5}s` }}
        />
      ))}
    </div>
  );
}

export default function Background({ scene = 'clear-day' }) {
  const reduce = useReducedMotion();
  const [kind, time] = scene.split('-');
  const tone = time === 'night' && (kind === 'clear' || kind === 'cloudy') ? 'night' : kind;

  return (
    <div className="ink" aria-hidden="true">
      <AnimatePresence initial={false}>
        <motion.div
          key={tone}
          className={`ink-glow ink-glow--${tone}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      </AnimatePresence>
      <div className="ink-dots" />
      {!reduce && (kind === 'rain' || kind === 'storm') && <Precip kind="rain" />}
      {!reduce && kind === 'snow' && <Precip kind="snow" />}
    </div>
  );
}
