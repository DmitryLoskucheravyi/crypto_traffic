import { seededRandom } from '../seeded-random';

// Свечной ряд для фона hero. Значения — доли высоты графика (0…1), в пиксели
// их переводит компонент. Чистые функции: ряд целиком определяется seed'ами.

export type Candle = {
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  bull: boolean;
};

const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;
const easeInCubic = (x: number) => x * x * x;

/** Сюжет ряда: спад к середине, затем резкий разгон вверх. */
export function baseline(t: number): number {
  if (t < 0.5) {
    return 0.7 - 0.52 * easeInOutSine(t / 0.5);
  }
  return 0.16 + 0.82 * easeInCubic((t - 0.5) / 0.5);
}

/**
 * Хаотичный, но всегда видимый объём: шумный пол, который бар всегда
 * перекрывает, случайное тело и редкие всплески.
 */
export function volumeAt(vrand: () => number, delta: number): number {
  const noise = vrand();
  let v = 0.28 + noise * 0.4 + Math.abs(delta) * 0.9;
  if (vrand() > 0.78) v += 0.2 + vrand() * 0.24; // всплеск
  if (vrand() > 0.88) v *= 0.6; // затишье
  return Math.min(0.95, Math.max(0.2, v));
}

/** Стартовый ряд из `count` свечей вдоль baseline. */
export function buildCandles(count: number): Candle[] {
  const rand = seededRandom(42);
  // Отдельный поток для объёма — иначе он зеркалит цену, и тихие участки
  // рисуются пустым полом.
  const vrand = seededRandom(90210);
  const candles: Candle[] = [];

  for (let i = 0; i < count; i++) {
    const t0 = i / count;
    const t1 = (i + 1) / count;
    const b0 = baseline(t0) + (rand() - 0.5) * 0.06;
    const b1 = baseline(t1) + (rand() - 0.5) * 0.06;
    const bodyTop = Math.max(b0, b1);
    const bodyBottom = Math.min(b0, b1);
    const wick = 0.025 + rand() * 0.06;
    candles.push({
      open: b0,
      close: b1,
      high: Math.min(0.98, bodyTop + wick * (0.5 + rand())),
      low: Math.max(0.02, bodyBottom - wick * (0.5 + rand())),
      volume: volumeAt(vrand, b1 - b0),
      bull: b1 >= b0,
    });
  }
  return candles;
}

/**
 * Следующая свеча продолжает от последнего закрытия с лёгкой тягой к середине
 * полосы — ряд блуждает, но не уходит за край.
 */
export function nextCandle(prev: Candle, rand: () => number, vrand: () => number): Candle {
  const open = prev.close;
  const close = Math.min(0.94, Math.max(0.1, open + (rand() - 0.5) * 0.22 + (0.52 - open) * 0.08));
  const wick = 0.025 + rand() * 0.06;
  return {
    open,
    close,
    high: Math.min(0.98, Math.max(open, close) + wick * (0.5 + rand())),
    low: Math.max(0.02, Math.min(open, close) - wick * (0.5 + rand())),
    volume: volumeAt(vrand, close - open),
    bull: close >= open,
  };
}

export const candleMid = (c: Candle) => (c.open + c.close) / 2;
