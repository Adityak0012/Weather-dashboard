import { motion, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

/**
 * A number that springs smoothly to its value: it counts up when it first
 * appears and glides to new values (e.g. on a °C/°F switch).
 */
export default function AnimatedNumber({ value, className, from = 0 }) {
  const reduce = useReducedMotion();
  const spring = useSpring(reduce ? value : from, { stiffness: 70, damping: 18, mass: 0.9 });
  const rounded = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    if (reduce) spring.jump(value);
    else spring.set(value);
  }, [value, reduce, spring]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
