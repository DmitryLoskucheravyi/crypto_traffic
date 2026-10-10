// Маршруты «зарядов» по линиям фоновой сетки hero. Сетка — CSS-фон из
// прямоугольных ячеек, маршрут идёт строго по их границам.

export type Grid = { cols: number; rows: number; cellW: number; cellH: number };

/**
 * Случайное блуждание по рёбрам ячеек, которое никогда не разворачивается
 * назад: каждый ход — поворот, поэтому заряд огибает прямоугольники, а не
 * бежит одной длинной линией. Возвращает SVG-путь и длину в пикселях.
 */
export function buildRoute(
  rand: () => number,
  start: [number, number],
  grid: Grid,
): { d: string; length: number } {
  let [col, row] = start;
  const pts: [number, number][] = [[col, row]];
  let axis = rand() < 0.5 ? 0 : 1; // 0 — по горизонтали, 1 — по вертикали
  let length = 0;

  const moves = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < moves; i++) {
    const step = (rand() < 0.65 ? 1 : 2) * (rand() < 0.5 ? -1 : 1);
    if (axis === 0) {
      col = Math.min(grid.cols, Math.max(0, col + step));
    } else {
      row = Math.min(grid.rows, Math.max(0, row + step));
    }
    const prev = pts[pts.length - 1];
    if (col === prev[0] && row === prev[1]) continue; // упёрлись в край
    length +=
      axis === 0 ? Math.abs(col - prev[0]) * grid.cellW : Math.abs(row - prev[1]) * grid.cellH;
    pts.push([col, row]);
    axis = axis === 0 ? 1 : 0;
  }

  const d = pts
    .map(([c, r], i) => `${i === 0 ? 'M' : 'L'}${c * grid.cellW},${r * grid.cellH}`)
    .join(' ');
  return { d, length };
}
