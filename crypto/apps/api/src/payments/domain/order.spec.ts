import { findCourse } from '../../catalog/catalog';
import {
  CLOCK_SKEW_MS,
  isAwaitingPayment,
  isPayableBy,
  minutesLeft,
  newOrder,
  type Order,
} from './order';
import type { Trc20Transfer } from './transfer';

const NOW = new Date('2026-01-01T12:00:00Z');

function order(overrides: Partial<Order> = {}): Order {
  return {
    ...newOrder({
      orderId: 'o-1',
      telegramId: 1,
      course: findCourse('basic')!,
      amount: { amount: 10.0304, amountKey: '10.0304', offset: 304 },
      wallet: 'TW',
      ttlMinutes: 60,
      now: NOW,
    }),
    ...overrides,
  };
}

function transfer(at: number, amountKey = '10.0304'): Trc20Transfer {
  return {
    txId: 'tx',
    from: 'TS',
    to: 'TW',
    amountKey,
    rawValue: '0',
    symbol: 'USDT',
    timestamp: at,
  };
}

describe('newOrder', () => {
  it('берёт цену из курса и отсчитывает срок от now', () => {
    const o = order();

    expect(o).toMatchObject({ tier: 'basic', baseAmount: 10, status: 'pending', createdAt: NOW });
    expect(o.expiresAt.getTime() - NOW.getTime()).toBe(60 * 60_000);
    expect(o).toMatchObject({ notified: false, delivered: false });
  });
});

describe('isAwaitingPayment', () => {
  it('ждёт оплаты только pending в пределах срока', () => {
    expect(isAwaitingPayment(order(), NOW)).toBe(true);
    expect(isAwaitingPayment(order(), new Date(NOW.getTime() + 61 * 60_000))).toBe(false);
    expect(isAwaitingPayment(order({ status: 'paid' }), NOW)).toBe(false);
  });
});

describe('isPayableBy', () => {
  const t = NOW.getTime();

  it('принимает перевод на ту же сумму внутри окна', () => {
    expect(isPayableBy(order(), transfer(t + 5 * 60_000))).toBe(true);
  });

  it('не принимает другую сумму', () => {
    expect(isPayableBy(order(), transfer(t + 1000, '10.0305'))).toBe(false);
  });

  it('не принимает перевод раньше заказа, кроме запаса на часы', () => {
    expect(isPayableBy(order(), transfer(t - CLOCK_SKEW_MS / 2))).toBe(true);
    expect(isPayableBy(order(), transfer(t - CLOCK_SKEW_MS - 1))).toBe(false);
  });

  it('принимает поздно увиденный платёж просроченного заказа, но не после срока', () => {
    const expired = order({ status: 'expired' });
    expect(isPayableBy(expired, transfer(t + 59 * 60_000))).toBe(true);
    expect(isPayableBy(expired, transfer(t + 61 * 60_000))).toBe(false);
  });

  it('не трогает оплаченные и отменённые', () => {
    expect(isPayableBy(order({ status: 'paid' }), transfer(t + 1000))).toBe(false);
    expect(isPayableBy(order({ status: 'cancelled' }), transfer(t + 1000))).toBe(false);
  });
});

describe('minutesLeft', () => {
  it('не опускается ниже минуты', () => {
    expect(minutesLeft(order(), NOW)).toBe(60);
    expect(minutesLeft(order(), new Date(NOW.getTime() + 2 * 60 * 60_000))).toBe(1);
  });
});
