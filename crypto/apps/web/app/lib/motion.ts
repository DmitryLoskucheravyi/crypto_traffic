// Brand Motion Identity (locked, Phase 2.6) — Premium personality.
// Do not introduce arbitrary durations/easings outside these constants.
export const EASE = [0.4, 0, 0.2, 1] as const;

export const DURATION = {
  quick: 0.25,
  standard: 0.4,
  slow: 0.6,
};

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.standard, ease: EASE },
  },
};

export const fadeUpStagger = (stagger = 0.08) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger },
  },
});
