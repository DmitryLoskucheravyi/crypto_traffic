import type { Course, CourseTier } from '../../catalog/catalog';
import type { AllocatedAmount } from './amount';
import type { Trc20Transfer } from './transfer';

// Заказ и правила вокруг него — чистые данные и чистые функции. Ни Mongo, ни
// Nest, ни часов: время всегда приходит аргументом. Хранилище (OrderRepository)
// обязано соблюдать эти же правила, а тесты проверяют их без базы.

export const ORDER_STATUSES = ['pending', 'paid', 'expired', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Статусы, которые перевод может перевести в paid. expired здесь намеренно:
 * платёж, отправленный до конца срока, но увиденный после, должен засчитаться.
 */
export const PAYABLE_STATUSES: readonly OrderStatus[] = ['pending', 'expired'];

/**
 * Время блока берётся из сети, createdAt — с часов сервера. Запас гасит их
 * расхождение, чтобы перевод, сделанный сразу после выдачи реквизитов, не
 * оказался «раньше» своего заказа.
 */
export const CLOCK_SKEW_MS = 60_000;

export type Order = {
  orderId: string;
  telegramId: number;
  username?: string;
  tier: CourseTier;
  /** Цена уровня из каталога, без хвоста. */
  baseAmount: number;
  /** Точная сумма перевода, которую назвали пользователю. */
  amount: number;
  /**
   * Та же сумма строкой с фиксированными 4 знаками — по ней ищется заказ.
   * Сравнивать double с double на попадание «ровно в сумму» нельзя.
   */
  amountKey: string;
  wallet: string;
  status: OrderStatus;
  expiresAt: Date;
  paidAt?: Date;
  /** Хеш транзакции, которой закрылся заказ. */
  txId?: string;
  /** «Оплата получена» уже ушла — повторная попытка выдачи шлёт только файл. */
  notified: boolean;
  /** Материалы отправлены — повторный проход не шлёт их дважды. */
  delivered: boolean;
  createdAt: Date;
};

export type NewOrderInput = {
  orderId: string;
  telegramId: number;
  username?: string;
  course: Course;
  amount: AllocatedAmount;
  wallet: string;
  ttlMinutes: number;
  now: Date;
};

/** Фабрика заказа: все поля, которые не приходят снаружи, выводятся здесь. */
export function newOrder(input: NewOrderInput): Order {
  return {
    orderId: input.orderId,
    telegramId: input.telegramId,
    username: input.username,
    tier: input.course.tier,
    baseAmount: input.course.priceUsdt,
    amount: input.amount.amount,
    amountKey: input.amount.amountKey,
    wallet: input.wallet,
    status: 'pending',
    expiresAt: new Date(input.now.getTime() + input.ttlMinutes * 60_000),
    notified: false,
    delivered: false,
    createdAt: input.now,
  };
}

/** Заказ ещё ждёт оплаты и его сумма занята. */
export function isAwaitingPayment(order: Order, now: Date): boolean {
  return order.status === 'pending' && order.expiresAt > now;
}

/**
 * Окно, в которое перевод должен попасть, чтобы оплатить заказ: заказ создан
 * не позже перевода (с запасом на часы) и истекает не раньше него. Окно
 * сверяется со временем блока, а не с «сейчас» — иначе поздно увиденный
 * платёж терялся бы, а старый, перечитанный после рестарта, закрывал бы
 * новый заказ с освободившейся суммой.
 */
export function paymentWindow(transfer: Trc20Transfer): {
  createdNoLaterThan: Date;
  expiresNoEarlierThan: Date;
} {
  return {
    createdNoLaterThan: new Date(transfer.timestamp + CLOCK_SKEW_MS),
    expiresNoEarlierThan: new Date(transfer.timestamp),
  };
}

/** Может ли этот перевод оплатить этот заказ. */
export function isPayableBy(order: Order, transfer: Trc20Transfer): boolean {
  const window = paymentWindow(transfer);
  return (
    order.amountKey === transfer.amountKey &&
    PAYABLE_STATUSES.includes(order.status) &&
    order.createdAt <= window.createdNoLaterThan &&
    order.expiresAt >= window.expiresNoEarlierThan
  );
}

/** Сколько минут осталось до конца срока, не меньше одной — для текста. */
export function minutesLeft(order: Order, now: Date): number {
  return Math.max(1, Math.round((order.expiresAt.getTime() - now.getTime()) / 60_000));
}
