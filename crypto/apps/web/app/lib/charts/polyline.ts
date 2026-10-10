import { seededRandom } from '../seeded-random';

// Ломаная «графика цены» для ленты MarketChart: генерация и геометрия. Чистые
// функции — один и тот же seed всегда даёт один и тот же путь, поэтому
// серверная и первая клиентская отрисовка совпадают байт в байт.

export type Point = [number, number];

export type Polyline = {
  width: number;
  d: string;
  pts: Point[];
  /** Накопленная длина ломаной в каждой точке. */
  cum: number[];
  length: number;
};

export type WalkParams = {
  seed: number;
  /** Стартовая высота в долях от height. */
  baseline: number;
  /** Размах шага по вертикали. */
  amp: number;
  width: number;
  height: number;
};

/** Случайное блуждание в полосе 8–92% высоты, ~60 точек на 2200 единиц ширины. */
export function randomWalk({ seed, baseline, amp, width, height }: WalkParams): Point[] {
  const rand = seededRandom(seed);
  const points = Math.round((width / 2200) * 60);
  let y = height * baseline;
  const pts: Point[] = [];
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * width;
    y += (rand() - 0.5) * amp;
    y = Math.min(height * 0.92, Math.max(height * 0.08, y));
    pts.push([x, y]);
  }
  return pts;
}

export function buildPolyline(pts: Point[], width: number): Polyline {
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
}

/**
 * Где кончик прорисованной линии (по x), когда открыта доля `fraction` её
 * ДЛИНЫ. Из-за изломов длина и x расходятся, поэтому читаем накопленную
 * таблицу — иначе курсор уезжал бы вперёд кончика.
 */
export function xAtLengthFraction(g: Polyline, fraction: number): number {
  const target = Math.max(0, Math.min(1, fraction)) * g.length;
  let i = 1;
  while (i < g.cum.length - 1 && g.cum[i] < target) i++;
  const span = g.cum[i] - g.cum[i - 1] || 1;
  const t = (target - g.cum[i - 1]) / span;
  return g.pts[i - 1][0] + (g.pts[i][0] - g.pts[i - 1][0]) * t;
}

/** Высота линии в точке x — линейная интерполяция между соседними точками. */
export function yAtX(g: Polyline, x: number): number {
  const segments = g.pts.length - 1;
  const raw = (x / g.width) * segments;
  const i = Math.max(0, Math.min(segments - 1, Math.floor(raw)));
  const t = Math.max(0, Math.min(1, raw - i));
  return g.pts[i][1] + (g.pts[i + 1][1] - g.pts[i][1]) * t;
}
