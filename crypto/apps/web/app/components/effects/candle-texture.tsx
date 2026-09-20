import { seededRandom } from '../../lib/seeded-random';

// A still, muted echo of the hero's candle tape, used as the final CTA panel's
// texture so the page closes on the same image it opened with. No live stream,
// no glow filter, no interaction — it is wallpaper, and at this opacity it is
// read as texture rather than as a chart of anything.

const WIDTH = 1200;
const HEIGHT = 400;
const N = 46;
const COL_W = WIDTH / N;

type Bar = { x: number; top: number; bottom: number; high: number; low: number; bull: boolean };

const BARS: Bar[] = (() => {
  const rand = seededRandom(20260921);
  const bars: Bar[] = [];
  let level = 0.5;
  for (let i = 0; i < N; i++) {
    const open = level;
    // Pull back towards mid-band so the tape stays inside the panel.
    level = Math.min(0.9, Math.max(0.12, level + (rand() - 0.5) * 0.2 + (0.5 - level) * 0.08));
    const wick = 0.02 + rand() * 0.05;
    const top = Math.max(open, level);
    const bottom = Math.min(open, level);
    bars.push({
      x: i * COL_W + COL_W / 2,
      top,
      bottom,
      high: Math.min(0.98, top + wick),
      low: Math.max(0.02, bottom - wick),
      bull: level >= open,
    });
  }
  return bars;
})();

const toY = (v: number) => HEIGHT - v * HEIGHT;

export const CandleTexture = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    preserveAspectRatio="xMidYMid slice"
    className={className}
    aria-hidden="true"
  >
    {BARS.map((bar, i) => {
      const color = bar.bull ? 'hsl(var(--accent))' : 'hsl(var(--bear))';
      const bodyTop = toY(bar.top);
      const bodyH = Math.max(3, toY(bar.bottom) - bodyTop);
      const bodyW = COL_W * 0.62;
      return (
        <g key={i} fill={color} stroke={color}>
          <line x1={bar.x} y1={toY(bar.high)} x2={bar.x} y2={toY(bar.low)} strokeWidth={1.4} />
          <rect x={bar.x - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH} rx={1} />
        </g>
      );
    })}
  </svg>
);
