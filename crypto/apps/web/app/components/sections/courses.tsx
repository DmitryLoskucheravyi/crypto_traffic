'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { courses, type Course } from '../../lib/site-data';
import { BOT_URL } from '../../lib/config';
import { content } from '../../lib/content';
import { TierCheck, CtaArrow } from '../icons';
import { fadeUp, DURATION, EASE } from '../../lib/motion';
import { useMagnetic } from '../../lib/use-magnetic';

const TIER_LABELS: Record<Course['tier'], string> = {
  basic: 'Базовый',
  medium: 'Средний',
  advanced: 'Продвинутый',
};

const TIER_RANK: Record<Course['tier'], number> = {
  basic: 1,
  medium: 2,
  advanced: 3,
};

// How far the card leans towards the cursor. Small on purpose: the tilt should
// register as the card noticing the pointer, not as a toy.
const TILT = 4;

const TierBadge = ({ tier }: { tier: Course['tier'] }) => {
  const rank = TIER_RANK[tier];
  return (
    <svg width="76" height="52" viewBox="0 0 76 52" className="text-accent" aria-hidden="true">
      {[0, 1, 2].map((i) => {
        const filled = i < rank;
        const h = 18 + i * 14;
        return (
          <rect
            key={i}
            x={i * 28}
            y={52 - h}
            width="18"
            height={h}
            rx="3"
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.5}
            opacity={filled ? 1 : 0.3}
            // Rank readout at rest, audio meter on hover. fill-box keeps each
            // bar growing from its own base rather than the SVG origin.
            className="group-hover:animate-eq-bounce"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'bottom',
              animationDelay: `${i * 120}ms`,
            }}
          />
        );
      })}
    </svg>
  );
};

// Matches the `md:` breakpoint at which the grid goes from one column to three.
// Below it the cards are full-width, so the featured card's lift would only
// push it into the gutters — the variant is told to stay flat instead of a CSS
// class fighting the inline transform framer-motion writes.
const useWideViewport = () => {
  const [wide, setWide] = useState(true);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return wide;
};

const cardVariants = (i: number, featured: boolean) => ({
  hidden: { opacity: 0, y: 32, rotate: i === 1 ? 0 : i === 0 ? -3 : 3, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,
    // The featured card's lift is part of the entrance, not a CSS class — the
    // variant owns `scale`, so anything else setting it would be overwritten.
    scale: featured ? 1.04 : 1,
    transition: { duration: DURATION.slow, ease: EASE, delay: i * 0.1 },
  },
});

const CourseCard = ({
  course,
  index,
  featured,
}: {
  course: Course;
  index: number;
  featured: boolean;
}) => {
  const reduceMotion = useReducedMotion();
  const wide = useWideViewport();
  const magnetic = useMagnetic<HTMLAnchorElement>();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 220, damping: 22, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [TILT, -TILT]), spring);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-TILT, TILT]), spring);

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType !== 'mouse' || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const reset = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={cardVariants(index, featured && wide)}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={reduceMotion ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={`group relative flex flex-col overflow-hidden rounded-lg glass-panel ${
        // A ring rather than a border colour: .glass-panel owns the border
        // shorthand, so a border-* utility here would be a coin flip.
        featured
          ? 'z-10 ring-1 ring-accent/50 shadow-[0_30px_80px_-40px_hsl(var(--accent)/0.55)]'
          : ''
      }`}
    >
      {featured && (
        <span className="absolute right-3 top-3 z-10 rounded-full border border-accent/40 bg-bg/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent backdrop-blur sm:right-4 sm:top-4 sm:px-3">
          {content.courses.popular}
        </span>
      )}

      <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-bg">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(70% 60% at 50% 40%, hsl(var(--accent) / 0.14), transparent 70%)',
          }}
        />
        <TierBadge tier={course.tier} />
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <div className="flex items-center gap-2 text-accent">
          <TierCheck size={18} />
          <span className="font-mono text-xs uppercase tracking-wide">
            {TIER_LABELS[course.tier]}
          </span>
        </div>
        <h3 className="mt-4 text-lg font-medium sm:text-xl">{course.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{course.description}</p>

        {/* Цены здесь нет сознательно: стоимость живёт только в боте, поэтому
            лендингу нечем разойтись с тем, что человек увидит при оплате. */}
        <motion.a
          ref={magnetic.ref}
          style={magnetic.style}
          onPointerMove={magnetic.onPointerMove}
          onPointerLeave={magnetic.onPointerLeave}
          href={BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`group/cta mt-7 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md px-5 py-3 text-center transition-colors duration-standard ease-premium ${
            featured
              ? 'bg-accent text-bg hover:bg-ink'
              : 'border border-accent/40 text-accent hover:bg-accent hover:text-bg'
          }`}
        >
          {content.courses.cta}
          <CtaArrow
            size={16}
            className="transition-transform duration-standard ease-premium group-hover/cta:translate-x-1"
          />
        </motion.a>
      </div>
    </motion.div>
  );
};

export const Courses = () => (
  <section id="courses" aria-labelledby="courses-title" className="scroll-mt-24 py-20 md:py-32">
    <div className="mx-auto max-w-container px-5 sm:px-6 md:px-8">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUp}
      >
        <h2
          id="courses-title"
          className="text-[1.6rem] font-bold leading-tight sm:text-2xl md:text-[2rem] md:leading-[1.15]"
        >
          {content.courses.title}
        </h2>
        <p className="mt-3 max-w-lg text-ink-muted">{content.courses.sub}</p>
      </motion.div>

      {/* Perspective lives on the grid so all three cards tilt in the same
          optical space. */}
      <div
        className="mt-10 grid grid-cols-1 gap-5 sm:gap-6 md:mt-12 md:grid-cols-3 md:gap-8"
        style={{ perspective: 1200 }}
      >
        {courses.map((course, i) => (
          <CourseCard
            key={course.tier}
            course={course}
            index={i}
            featured={course.tier === 'medium'}
          />
        ))}
      </div>
    </div>
  </section>
);
