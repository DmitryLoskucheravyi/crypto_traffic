'use client';

import { useEffect, useRef, useState } from 'react';

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/\<>*#';

type Props = {
  text: string;
  trigger?: 'mount' | 'inView';
  duration?: number;
  className?: string;
};

// Used exactly twice on the page (hero H1, final CTA H2) — it is a signature
// moment, not a decoration for every heading.
// The real text is always in the DOM for assistive tech; the animated layer is
// aria-hidden, so the heading is announced once and correctly.
export const ScrambleText = ({ text, trigger = 'mount', duration = 280, className }: Props) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let cancelled = false;

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / duration);
        const settled = Math.floor(text.length * t);
        setDisplay(
          text
            .split('')
            .map((char, i) => {
              if (i < settled || char === ' ') return char;
              return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            })
            .join(''),
        );
        if (t < 1) frame = requestAnimationFrame(tick);
        else setDisplay(text);
      };
      frame = requestAnimationFrame(tick);
    };

    if (trigger === 'mount') {
      run();
      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        run();
      },
      { threshold: 0.5 },
    );
    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text, trigger, duration]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display}</span>
    </span>
  );
};
