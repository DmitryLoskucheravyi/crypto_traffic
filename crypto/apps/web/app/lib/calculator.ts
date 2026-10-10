import type { Calculator, CalculatorTier, CourseTier } from './site-data';

// Логика калькулятора дохода отдельно от вёрстки: компонент держит только
// состояние ползунка и выбранного уровня, а числа считает здесь.

export type IncomeRange = { low: number; high: number };

/** Стартовое значение ползунка — середина диапазона. */
export function initialAmount(calc: Calculator): number {
  return Math.round((calc.amountMin + calc.amountMax) / 2);
}

/** Коэффициенты уровня; неизвестный уровень — первый из списка. */
export function tierRates(calc: Calculator, tier: CourseTier): CalculatorTier {
  return calc.tiers.find((t) => t.tier === tier) ?? calc.tiers[0];
}

/** Итоговая сумма за горизонт расчёта: вложение плюс процент от него. */
export function projectIncome(amount: number, rates: CalculatorTier): IncomeRange {
  return {
    low: amount * (1 + rates.lowPct / 100),
    high: amount * (1 + rates.highPct / 100),
  };
}
