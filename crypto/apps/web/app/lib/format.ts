// Форматирование чисел для страницы — чистые функции без состояния.

const LOCALE = 'ru-RU';

/** 12345.6 → «12 346». */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(Math.round(value));
}

/** 5000, 'USD' → «5 000 USD». */
export function formatMoney(value: number, currency: string): string {
  return `${formatNumber(value)} ${currency}`;
}

/** Котировка на ленте: 64128.4 → «64 128,40». */
export function formatQuote(value: number): string {
  const [int, frac] = value.toFixed(2).split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${frac}`;
}
