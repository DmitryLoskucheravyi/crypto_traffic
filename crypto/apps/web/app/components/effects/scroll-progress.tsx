'use client';

import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';

// Page-wide read position. Kept even with reduced motion — it is an indicator,
// not decoration — but the spring smoothing is dropped so it never drifts on
// its own after the scroll stops.
export const ScrollProgress = () => {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 180, damping: 30, mass: 0.2 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: reduceMotion ? scrollYProgress : smooth }}
      className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-accent"
    />
  );
};
