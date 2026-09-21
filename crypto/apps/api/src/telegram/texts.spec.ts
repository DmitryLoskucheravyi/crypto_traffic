import { CATALOG, findCourse } from '../catalog/catalog';
import type { Order } from '../payments/order.schema';
import { courseCard, invoice, pendingNotice, paidNotice } from './texts';

function order(overrides: Partial<Order> = {}): Order {
  return {
    orderId: 'order-1',
    telegramId: 1,
    tier: 'basic',
    baseAmount: 10,
    amount: 10.0304,
    amountKey: '10.0304',
    wallet: 'TStubWalletAddressForTests000000000',
    status: 'pending',
    expiresAt: new Date(Date.now() + 30 * 60_000),
    delivered: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Order;
}

describe('тексты бота', () => {
  it('называет цену уровня в карточке курса', () => {
    const course = findCourse('advanced')!;

    expect(courseCard(course)).toContain('40 USDT');
  });

  it('в реквизитах сумма стоит целиком, с четырьмя знаками', () => {
    const text = invoice(findCourse('basic')!, order());

    expect(text).toContain('<code>10.0304</code>');
    expect(text).toContain('TRC20');
    expect(text).toContain('<code>TStubWalletAddressForTests000000000</code>');
  });

  it('предупреждает, что сумма должна совпасть в точности', () => {
    const text = invoice(findCourse('medium')!, order({ amount: 25.4211, baseAmount: 25 }));

    expect(text).toContain('ровно');
    expect(text).toContain('25.4211');
  });

  it('в ожидании повторяет ту же сумму, что и в реквизитах', () => {
    const pending = order({ amount: 40.0072, baseAmount: 40, tier: 'advanced' });

    expect(pendingNotice(pending)).toContain('40.0072');
  });

  it('после оплаты показывает транзакцию, если она известна', () => {
    const paid = order({ status: 'paid', txId: 'abc123' });

    expect(paidNotice(findCourse('basic')!, paid)).toContain('abc123');
    expect(paidNotice(findCourse('basic')!, order({ status: 'paid' }))).not.toContain('Транзакция');
  });

  it('карточка есть для каждого уровня каталога', () => {
    for (const course of CATALOG) {
      const card = courseCard(course);
      expect(card).toContain(course.title);
      expect(card).toContain(course.description);
    }
  });
});
