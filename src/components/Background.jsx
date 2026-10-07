import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

// Deterministic pseudo-random so particles don't jump between renders.
function seeded(n) {
  let s = n * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function useParticles(count, seed) {
  return useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, (_, i) => ({
      i, x: r() * 100, y: r() * 100, s: r(), d: r(),
    }));
  }, [count, seed]);
}

function Stars() {
  const stars = useParticles(70, 7);
  return stars.map((p) => (
    <span
      key={p.i}
      className="star"
      style={{
        left: `${p.x}%`, top: `${p.y * 70}%`,
        width: 1 + p.s * 1.6, height: 1 + p.s * 1.6,
        animationDelay: `${p.d * 6}s`, animationDuration: `${3 + p.s * 4}s`,
      }}
    />
  ));
}

function Rain({ heavy }) {
  const drops = useParticles(heavy ? 90 : 60, 3);
  return drops.map((p) => (
    <span
      key={p.i}
      className="drop"
      style={{
        left: `${p.x}%`,
        height: 10 + p.s * 18,
        opacity: 0.15 + p.s * 0.35,
        animationDelay: `${-p.d * 2}s`,
        animationDuration: `${0.55 + (1 - p.s) * 0.5}s`,
      }}
    />
  ));
}

function Snow() {
  const flakes = useParticles(55, 11);
  return flakes.map((p) => (
    <span
      key={p.i}
      className="flake"
      style={{
        left: `${p.x}%`,
        width: 2 + p.s * 4, height: 2 + p.s * 4,
        opacity: 0.35 + p.s * 0.5,
        animationDelay: `${-p.d * 10}s`,
        animationDuration: `${7 + (1 - p.s) * 7}s`,
      }}
    />
  ));
}

/** Full-screen animated sky that follows the current conditions. */
export default function Background({ scene = 'clear-day' }) {
  const reduce = useReducedMotion();
  const [kind, time] = scene.split('-');
  const night = time === 'night';

  return (
    <div className="sky" aria-hidden="true">
      <AnimatePresence initial={false}>
        <motion.div
          key={scene}
          className={`sky-layer sky--${scene}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          {kind === 'clear' && !night && <div className="sun-glow" />}
          {(kind === 'clear' || kind === 'cloudy') && night && !reduce && <Stars />}
          {(kind === 'cloudy' || kind === 'fog' || kind === 'rain' || kind === 'storm' || kind === 'snow') && (
            <>
              <div className="cloud-blob cloud-blob--a" />
              <div className="cloud-blob cloud-blob--b" />
            </>
          )}
          {(kind === 'rain' || kind === 'storm') && !reduce && <Rain heavy={kind === 'storm'} />}
          {kind === 'snow' && !reduce && <Snow />}
          {kind === 'storm' && !reduce && <div className="lightning" />}
        </motion.div>
      </AnimatePresence>
      <div className="sky-grain" />
    </div>
  );
}
