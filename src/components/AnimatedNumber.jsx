import { motion, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

/** A number that springs smoothly to its new value (e.g. on unit change). */
export default function AnimatedNumber({ value, className }) {
  const reduce = useReducedMotion();
  const spring = useSpring(value, { stiffness: 90, damping: 20, mass: 0.8 });
  const rounded = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    if (reduce) spring.jump(value);
    else spring.set(value);
  }, [value, reduce, spring]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
