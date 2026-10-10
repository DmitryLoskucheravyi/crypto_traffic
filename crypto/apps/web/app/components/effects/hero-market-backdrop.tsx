'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { seededRandom } from '../../lib/seeded-random';
import { buildCandles, candleMid, nextCandle, type Candle } from '../../lib/charts/candles';
import { buildRoute, type Grid } from '../../lib/charts/grid-routes';

// Tighter viewBox than the hero container: with preserveAspectRatio="slice" a
// smaller box means a larger on-screen scale, so the candles read bigger.
const WIDTH = 1150;
const HEIGHT = 648;
const VOLUME_H = 108;
const CHART_H = HEIGHT - VOLUME_H;
// Fewer columns across the same width = each candle is drawn larger. The
// viewBox height maps to the hero height, so this is the knob that zooms.
const N = 32;
// Small gutter so the newest candle is not flush against the frame.
const SERIES_W = WIDTH - 40;
const COL_W = SERIES_W / N;
// A new candle prints every 15s; the series jumps one column, no travel.
const STEP_MS = 15000;

// Server render and first client render both start here — the live stream only
// begins once the interval runs, so there is nothing to mismatch on hydration.
const INITIAL = buildCandles(N);
const TIP = N - 1; // index of the newest candle

const toY = (v: number) => CHART_H - v * CHART_H;
const colX = (i: number) => i * COL_W + COL_W / 2;

// Charges running along the .chart-grid cell borders. The grid is a CSS
// background on 72px columns / 42px rows, so an SVG with no viewBox is used
// here: one user unit is one CSS pixel, which is what keeps a route exactly on
// the ruled lines instead of near them.
const CELL_W = 72;
const CELL_H = 42;
const GRID_COLS = 15;
const GRID_ROWS = 17;
const GRID: Grid = { cols: GRID_COLS, rows: GRID_ROWS, cellW: CELL_W, cellH: CELL_H };

type Route = {
  d: string;
  length: number;
  dur: number;
  begin: number;
  bear: boolean;
  reverse: boolean;
};

// Hand-placed starts: a purely random draw kept clumping the routes into the
// same corner of the grid. The walk itself stays random.
const STARTS: [number, number][] = [
  [1, 3],
  [5, 12],
  [9, 2],
  [13, 9],
  [3, 15],
  [7, 6],
  [11, 14],
  [2, 9],
  [14, 4],
];

const ROUTES: Route[] = (() => {
  const rand = seededRandom(7331);
  const out: Route[] = [];
  while (out.length < STARTS.length) {
    const { d, length } = buildRoute(rand, STARTS[out.length], GRID);
    if (length < CELL_W) continue; // degenerate walk, try again
    out.push({
      d,
      length,
      // Short travel window inside a long cycle: the charge is visibly moving
      // when it runs, but any given route only lights up every 9-16s.
      dur: 9 + rand() * 7,
      begin: rand() * 14,
      // Explicit, not drawn: a 25% dice roll on this seed kept handing out
      // five reds out of nine. Two red routes against seven green.
      bear: out.length === 2 || out.length === 6,
      reverse: rand() < 0.5,
    });
  }
  return out;
})();

const DASH = 26; // px — a short streak, not a line across the screen

const GridCharges = () => (
  <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
    {ROUTES.map((route, i) => {
      const color = route.bear ? 'hsl(var(--bear))' : 'hsl(var(--accent))';
      const from = route.reverse ? -route.length : DASH;
      const to = route.reverse ? DASH : -route.length;
      return (
        <path
          key={i}
          d={route.d}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeDasharray={`${DASH} ${route.length}`}
          strokeDashoffset={from}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        >
          <animate
            attributeName="stroke-dashoffset"
            values={`${from};${from};${to};${to}`}
            keyTimes="0;0.22;0.6;1"
            dur={`${route.dur.toFixed(1)}s`}
            begin={`${route.begin.toFixed(1)}s`}
            repeatCount="indefinite"
          />
        </path>
      );
    })}
  </svg>
);

export const HeroMarketBackdrop = () => {
  const reduceMotion = useReducedMotion();
  const lineRef = useRef<SVGLineElement>(null);
  const [series, setSeries] = useState<Candle[]>(INITIAL);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    // Own streams, seeded once: the live tail is generated, never fetched, and
    // it picks up where the built-in series leaves off.
    const rand = seededRandom(5150);
    const vrand = seededRandom(31337);
    const id = setInterval(() => {
      setSeries((prev) => [...prev.slice(1), nextCandle(prev[prev.length - 1], rand, vrand)]);
      setStep((s) => s + 1);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !lineRef.current) return;
    lineRef.current.animate([{ opacity: 0.3 }, { opacity: 0.75 }, { opacity: 0.3 }], {
      duration: 2800,
      iterations: Infinity,
      easing: 'ease-in-out',
    });
  }, [reduceMotion]);

  return (
    <div className="absolute inset-0 -z-10 chart-grid overflow-hidden" aria-hidden="true">
      {/* Above the grid background, below the candles — the charges belong to
          the grid, not to the chart. */}
      {!reduceMotion && <GridCharges />}

      {/* xMax, not xMid: slice crops whatever does not fit, and pinning the
          right edge means it always eats the oldest candles on the left, so
          the newest print stays on screen at every viewport ratio. */}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMaxYMid slice"
        className="h-full w-full"
      >
        <defs>
          <filter id="candle-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* The level tracks the newest close, so it marks the live price
            rather than one that already scrolled away. */}
        <line
          ref={lineRef}
          x1={0}
          y1={toY(candleMid(series[TIP]))}
          x2={WIDTH}
          y2={toY(candleMid(series[TIP]))}
          stroke="hsl(var(--accent))"
          strokeWidth={2.5}
          strokeDasharray="2 7"
          opacity={0.55}
          filter="url(#candle-glow)"
        />

        {/* Columns are fixed; the data slides through them. Every 15s each
            candle takes the slot to its left in one frame — a TradingView-style
            print, not a scroll. Only the newest candle is animated: it grows
            out of the axis so the eye catches that something arrived. */}
        <g filter="url(#candle-glow)">
          {series.map((c, i) => {
            const x = colX(i);
            const color = c.bull ? 'hsl(var(--accent))' : 'hsl(var(--bear))';
            const bodyTop = toY(Math.max(c.open, c.close));
            const bodyBottom = toY(Math.min(c.open, c.close));
            const bodyH = Math.max(4, bodyBottom - bodyTop);
            const bodyW = COL_W * 0.8;
            const isTip = i === TIP;

            return (
              <motion.g
                // Remounting the tip on every step is what replays its entrance;
                // the others keep their identity and simply re-render in place.
                key={isTip ? `tip-${step}` : i}
                initial={reduceMotion ? false : { opacity: 0, scaleY: 0 }}
                animate={reduceMotion ? false : { opacity: 1, scaleY: 1 }}
                transition={{
                  duration: isTip && step > 0 ? 0.4 : 0.55,
                  ease: [0.4, 0, 0.2, 1],
                  // Only the first paint cascades; later prints are immediate.
                  delay: step === 0 ? i * 0.03 : 0,
                }}
                style={{ transformOrigin: `${x}px ${CHART_H}px` }}
              >
                <line
                  x1={x}
                  y1={toY(c.high)}
                  x2={x}
                  y2={toY(c.low)}
                  stroke={color}
                  strokeWidth={2.2}
                />
                <rect
                  x={x - bodyW / 2}
                  y={bodyTop}
                  width={bodyW}
                  height={bodyH}
                  fill={color}
                  rx={1.5}
                />
                <rect
                  x={x - bodyW / 2}
                  y={CHART_H + VOLUME_H * (1 - c.volume) + 10}
                  width={bodyW}
                  height={Math.max(2, VOLUME_H * c.volume - 10)}
                  fill={color}
                  opacity={0.42}
                />
              </motion.g>
            );
          })}
        </g>
      </svg>

      {/* Readability fade behind the headline column — chart stays fully
          vivid across the rest of the hero. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, hsl(var(--bg) / 0.9) 0%, hsl(var(--bg) / 0.62) 30%, hsl(var(--bg) / 0.12) 50%, transparent 68%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4"
        style={{
          background:
            'linear-gradient(0deg, hsl(var(--bg)) 0%, hsl(var(--bg) / 0.55) 40%, transparent 100%)',
        }}
      />
    </div>
  );
};
