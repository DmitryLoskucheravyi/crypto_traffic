// Приём платежей «как в казино»: у нас один кошелёк на всех, поэтому платёж
// опознаётся не по отправителю, а по сумме. Каждому заказу выдаётся своя сумма
// с уникальным «хвостом» в младших знаках — 10 USDT превращается в 10.0304, и
// ровно эта сумма ждёт ровно этот заказ.
//
// Хвост занимает 4 знака после запятой, хотя у USDT их 6: так сумма остаётся
// читаемой глазами, а два свободных знака гасят возможную пыль от кошелька
// отправителя при сравнении.

/** Знаков после запятой в сумме, которую мы называем пользователю. */
export const AMOUNT_DECIMALS = 4;

/** Сколько знаков у самого токена (USDT TRC20). */
export const TOKEN_DECIMALS = 6;

/** Диапазон хвоста: 0.0001 … 0.9999 — 9999 одновременных заказов на один уровень. */
export const MIN_OFFSET = 1;
export const MAX_OFFSET = 9999;

export type AllocatedAmount = {
  /** Точная сумма перевода, например 10.0304. */
  amount: number;
  /** Она же строкой — ключ, по которому ищется заказ. */
  amountKey: string;
  /** Хвост в единицах 0.0001 — хранится, чтобы не считать его обратно. */
  offset: number;
};

/** Приводит число к нашему шагу — единственное место, где живёт округление. */
export function toAmountKey(value: number): string {
  return value.toFixed(AMOUNT_DECIMALS);
}

export function buildAmount(base: number, offset: number): number {
  return Number((base + offset / 10 ** AMOUNT_DECIMALS).toFixed(AMOUNT_DECIMALS));
}

export class AmountSpaceExhaustedError extends Error {
  constructor(base: number) {
    super(`Свободных сумм для базовой цены ${base} не осталось`);
    this.name = 'AmountSpaceExhaustedError';
  }
}

/**
 * Подбирает свободную сумму для базовой цены.
 *
 * `taken` — ключи сумм, которые уже ждут оплаты (по всем уровням сразу: суммы
 * разных уровней никогда не пересекаются, но проверять общий список дешевле и
 * надёжнее, чем полагаться на это).
 *
 * Сначала несколько случайных попыток — так соседние заказы не выстраиваются в
 * предсказуемую последовательность. Если не повезло (пространство плотно
 * занято), добираем первым свободным хвостом линейным проходом.
 */
export function allocateAmount(
  base: number,
  taken: ReadonlySet<string>,
  random: () => number = Math.random,
  attempts = 12,
): AllocatedAmount {
  const span = MAX_OFFSET - MIN_OFFSET + 1;

  for (let i = 0; i < attempts; i += 1) {
    const offset = MIN_OFFSET + Math.floor(random() * span);
    const amount = buildAmount(base, offset);
    const amountKey = toAmountKey(amount);
    if (!taken.has(amountKey)) return { amount, amountKey, offset };
  }

  for (let offset = MIN_OFFSET; offset <= MAX_OFFSET; offset += 1) {
    const amount = buildAmount(base, offset);
    const amountKey = toAmountKey(amount);
    if (!taken.has(amountKey)) return { amount, amountKey, offset };
  }

  throw new AmountSpaceExhaustedError(base);
}

/**
 * Переводит `value` из ончейн-записи (целое в минимальных единицах токена) в
 * тот же ключ, которым помечен заказ.
 *
 * Считаем в целых через BigInt и отбрасываем остаток, а не округляем: через
 * double сумма 10.0304 уже не представима точно, и округление «вверх» увело бы
 * платёж к соседнему заказу. Отбрасываемая пыль — те самые два лишних знака
 * токена, ради которых хвост занимает только четыре.
 */
export function transferAmountKey(value: string | number, decimals = TOKEN_DECIMALS): string {
  let raw: bigint;
  try {
    raw = BigInt(typeof value === 'number' ? Math.trunc(value) : value.trim());
  } catch {
    return toAmountKey(0);
  }
  if (raw < 0n) return toAmountKey(0);

  // Приводим к шагу 0.0001 независимо от того, сколько знаков у токена.
  const extra = decimals - AMOUNT_DECIMALS;
  const steps = extra >= 0 ? raw / 10n ** BigInt(extra) : raw * 10n ** BigInt(-extra);

  const scale = 10n ** BigInt(AMOUNT_DECIMALS);
  const whole = steps / scale;
  const fraction = steps % scale;

  return `${whole}.${fraction.toString().padStart(AMOUNT_DECIMALS, '0')}`;
}
