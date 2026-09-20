'use client';

import { useEffect, useRef, useState } from 'react';

// Types a short string out character by character when it scrolls into view.
// Used for prices: the real value renders on the server, the animation only
// replays it, so the page never ships a half-typed number.
export const TypedValue = ({
  value,
  speed = 30,
  className,
}: {
  value: string;
  speed?: number;
  className?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timer: ReturnType<typeof setInterval>;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        let i = 0;
        setDisplay('');
        timer = setInterval(() => {
          i += 1;
          setDisplay(value.slice(0, i));
          if (i >= value.length) clearInterval(timer);
        }, speed);
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, [value, speed]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">{display}</span>
    </span>
  );
};
