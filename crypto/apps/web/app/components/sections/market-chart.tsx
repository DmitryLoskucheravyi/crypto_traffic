'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { content } from '../../lib/content';
import { seededRandom } from '../../lib/seeded-random';
import { fadeUp } from '../../lib/motion';

const HEIGHT = 360;
const VIEWPORT = 1280;
const PAN = 920; // how far the slowest line travels across a full scroll pass

// Three lines over the same band. Each has its own seed, drift and pan speed —
// the faster ones travel further per scroll, so the trio never moves as a block.
const LINES = [
  { seed: 1337, color: 'hsl(var(--accent))', baseline: 0.62, amp: 60, speed: 1, width: 2.5, opacity: 1 },
  { seed: 8821, color: 'hsl(358 72% 58%)', baseline: 0.48, amp: 52, speed: 1.18, width: 2, opacity: 0.85 },
  { seed: 4207, color: 'hsl(44 92% 58%)', baseline: 0.74, amp: 46, speed: 1.36, width: 2, opacity: 0.85 },
] as const;

type Geometry = {
  width: number;
  d: string;
  pts: [number, number][];
  cum: number[]; // cumulative polyline length at each point
  length: number;
};

function buildPoints(seed: number, baseline: number, amp: number, width: number): [number, number][] {
  const rand = seededRandom(seed);
  const points = Math.round((width / 2200) * 60);
  let y = HEIGHT * baseline;
  const pts: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * width;
    y += (rand() - 0.5) * amp;
    y = Math.min(HEIGHT * 0.92, Math.max(HEIGHT * 0.08, y));
    pts.push([x, y]);
  }
  return pts;
}

// A line that pans further needs a proportionally longer path, otherwise its
// tail scrolls past the right edge before the section is done.
const GEOMETRY: Geometry[] = LINES.map((line) => {
  const width = VIEWPORT + PAN * line.speed;
  const pts = buildPoints(line.seed, line.baseline, line.amp, width);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    cum.push(cum[i - 1] + Math.hypot(dx, dy));
  }
  return {
    width,
    pts,
    cum,
    length: cum[cum.length - 1],
    d: pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' '),
  };
});

// Where the stroke's drawn tip is, in user units, once `fraction` of the path's
// LENGTH has been revealed. The jitter makes length and x diverge, so reading
// the cumulative table is what keeps the cursor exactly on the tip instead of
// floating ahead of it.
function xAtLengthFraction(g: Geometry, fraction: number): number {
  const target = Math.max(0, Math.min(1, fraction)) * g.length;
  let i = 1;
  while (i < g.cum.length - 1 && g.cum[i] < target) i++;
  const span = g.cum[i] - g.cum[i - 1] || 1;
  const t = (target - g.cum[i - 1]) / span;
  return g.pts[i - 1][0] + (g.pts[i][0] - g.pts[i - 1][0]) * t;
}

function yAtX(g: Geometry, x: number): number {
  const segments = g.pts.length - 1;
  const raw = (x / g.width) * segments;
  const i = Math.max(0, Math.min(segments - 1, Math.floor(raw)));
  const t = Math.max(0, Math.min(1, raw - i));
  return g.pts[i][1] + (g.pts[i + 1][1] - g.pts[i][1]) * t;
}

// Atmospheric only: a random walk started from a fixed seed value, never a real
// quote. Labelled "демо" on screen and generated client-side after mount, so
// there is no fabricated figure in the server-rendered markup either.
const START = 64128.4;
const fmt = (v: number) => {
  const [int, frac] = v.toFixed(2).split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${frac}`;
};

// Its own component on purpose: the tape updates every couple of seconds and
// re-rendering the chart with it would fight the transforms GSAP writes.
const Ticker = () => {
  const [quote, setQuote] = useState({ value: START, up: true });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setQuote((prev) => {
        // Mild pull back towards the starting level so the walk wanders without
        // drifting off into a number nobody would believe.
        const step = (Math.random() - 0.5) * 46 + (START - prev.value) * 0.05;
        return { value: prev.value + step, up: step >= 0 };
      });
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="mt-8 shrink-0 md:mt-0 md:text-right" aria-hidden="true">
      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-muted">
        {content.marketChart.tickerLabel}
      </span>
      <div
        className={`font-mono text-3xl tabular-nums transition-colors duration-standard ease-premium md:text-5xl ${
          quote.up ? 'text-accent' : 'text-bear'
        }`}
      >
        {fmt(quote.value)}
      </div>
    </div>
  );
};

export const MarketChart = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const panRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const cursorRef = useRef<SVGGElement>(null);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const ringRefs = useRef<(SVGCircleElement | null)[]>([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !sectionRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });

      LINES.forEach((line, i) => {
        const path = pathRefs.current[i];
        const pan = panRefs.current[i];
        if (!path || !pan) return;

        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

        tl.to(path, { strokeDashoffset: 0, ease: 'none', duration: 1 / line.speed }, 0).to(
          pan,
          { x: -PAN * line.speed, ease: 'none', duration: 1 },
          0,
        );
      });

      // Per-line turning-point tracking for the pulses. A flip only counts once
      // the line has actually travelled away from the last pivot, otherwise the
      // jitter between two sample points would strobe.
      const track = LINES.map(() => ({ y: 0, dir: 0, pivot: 0, seeded: false }));

      const flash = (i: number, x: number, y: number) => {
        const ring = ringRefs.current[i];
        if (!ring) return;
        ring.setAttribute('cx', String(x));
        ring.setAttribute('cy', String(y));
        gsap.fromTo(
          ring,
          { attr: { r: 3 }, opacity: 0.8 },
          { attr: { r: 18 }, opacity: 0, duration: 0.7, ease: 'power2.out', overwrite: true },
        );
      };

      // The cursor rides the drawn tip of the SLOWEST line, clamped to the
      // visible plot. Anything faster has already drawn past that x, so every
      // rider dot always sits on a stroke that exists.
      const draw = (p: number) => {
        const plot = plotRef.current;
        const cursor = cursorRef.current;
        if (!plot || !cursor) return;

        const { width: plotW, height: plotH } = plot.getBoundingClientRect();
        if (!plotW || !plotH) return;
        const scale = plotH / HEIGHT;

        const lead = LINES[0];
        const tipX =
          xAtLengthFraction(GEOMETRY[0], p * lead.speed) * scale - PAN * lead.speed * p;
        const cx = Math.max(0, Math.min(tipX, plotW * 0.92));

        cursor.setAttribute('transform', `translate(${cx.toFixed(1)}, 0)`);
        cursor.style.opacity = String(Math.min(1, p * 10, (1 - p) * 10));

        LINES.forEach((line, i) => {
          const dot = dotRefs.current[i];
          if (!dot) return;
          const tx = -PAN * line.speed * p;
          const ux = (cx - tx) / scale;
          if (ux < 0 || ux > GEOMETRY[i].width) {
            dot.style.opacity = '0';
            return;
          }
          const y = yAtX(GEOMETRY[i], ux) * scale;
          dot.style.opacity = '1';
          dot.setAttribute('cx', cx.toFixed(1));
          dot.setAttribute('cy', y.toFixed(1));

          const state = track[i];
          if (!state.seeded) {
            Object.assign(state, { y, pivot: y, seeded: true });
            return;
          }
          const delta = y - state.y;
          if (Math.abs(delta) < 0.35) return;
          const dir = delta > 0 ? 1 : -1;
          if (state.dir !== 0 && dir !== state.dir && Math.abs(state.y - state.pivot) > 6) {
            flash(i, cx, state.y);
            state.pivot = state.y;
          }
          state.dir = dir;
          state.y = y;
        });
      };

      tl.eventCallback('onUpdate', () => draw(tl.progress()));
      draw(0);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="overflow-hidden py-24 md:py-32">
      <div className="mx-auto max-w-container px-6 md:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="md:flex md:items-end md:justify-between md:gap-12"
        >
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
              {content.marketChart.eyebrow}
            </span>
            <h2 className="mt-4 max-w-2xl text-2xl font-semibold md:text-[2rem] md:leading-[1.15]">
              {content.marketChart.title}
            </h2>
            <p className="mt-3 max-w-lg text-ink-muted">{content.marketChart.sub}</p>
          </div>

          {/* Deliberately unlabelled by asset and marked as a simulation — the
              tape is here for atmosphere, not as a quote. */}
          <Ticker />
        </motion.div>
      </div>

      <div ref={plotRef} className="relative mt-14 h-[220px] md:h-[300px]">
        {/* Same ruled paper as the hero — it ties the two chart moments together
            without adding anything new to the design system. */}
        <div className="chart-grid chart-grid-fade absolute inset-0" aria-hidden="true" />

        {LINES.map((line, i) => (
          <div
            key={line.seed}
            ref={(el) => {
              panRefs.current[i] = el;
            }}
            className="absolute inset-y-0 left-0"
            style={{ width: GEOMETRY[i].width }}
          >
            <svg
              width={GEOMETRY[i].width}
              height={HEIGHT}
              viewBox={`0 0 ${GEOMETRY[i].width} ${HEIGHT}`}
              className="h-full w-auto"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <path
                ref={(el) => {
                  pathRefs.current[i] = el;
                }}
                d={GEOMETRY[i].d}
                fill="none"
                stroke={line.color}
                strokeOpacity={line.opacity}
                strokeWidth={line.width}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ))}

        {/* Overlay has no viewBox on purpose: one user unit is one CSS pixel,
            which is what lets the riders be placed from measured geometry. */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <g ref={cursorRef} style={{ opacity: 0 }}>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="100%"
              stroke="hsl(var(--ink))"
              strokeOpacity="0.28"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
          </g>
          {LINES.map((line, i) => (
            <g key={line.seed}>
              <circle
                ref={(el) => {
                  ringRefs.current[i] = el;
                }}
                r="0"
                fill="none"
                stroke={line.color}
                strokeWidth="1.5"
                opacity="0"
              />
              <circle
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                r={i === 0 ? 4 : 3}
                fill={line.color}
                style={{ opacity: 0, filter: `drop-shadow(0 0 6px ${line.color})` }}
              />
            </g>
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-bg to-transparent md:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-bg to-transparent md:w-32" />
      </div>
    </section>
  );
};
