import {
  AmountSpaceExhaustedError,
  MAX_OFFSET,
  MIN_OFFSET,
  allocateAmount,
  buildAmount,
  toAmountKey,
  transferAmountKey,
} from './amount';

describe('buildAmount', () => {
  it('вешает хвост на базовую цену', () => {
    expect(buildAmount(10, 304)).toBe(10.0304);
    expect(buildAmount(25, 1)).toBe(25.0001);
    expect(buildAmount(40, 9999)).toBe(40.9999);
  });

  it('держит ровно четыре знака, несмотря на плавающую точку', () => {
    expect(toAmountKey(buildAmount(10, 3))).toBe('10.0003');
    expect(toAmountKey(buildAmount(25, 2900))).toBe('25.2900');
  });
});

describe('allocateAmount', () => {
  it('не выдаёт сумму, которая уже кого-то ждёт', () => {
    // Генератор трижды приводит к занятой 10.0004 и только потом — к свободной.
    const sequence = [0.0004, 0.0004, 0.0004, 0.0009];
    const random = () => sequence.shift() ?? 0;

    const result = allocateAmount(10, new Set(['10.0004']), random);

    expect(result.amountKey).toBe('10.0009');
    expect(result.amount).toBe(10.0009);
  });

  it('добирает линейно, когда случайные попытки не попали в свободное', () => {
    const taken = new Set(['10.0001', '10.0002']);

    const result = allocateAmount(10, taken, () => 0, 3);

    expect(result.amountKey).toBe('10.0003');
  });

  it('держится в заявленном диапазоне хвоста', () => {
    for (let i = 0; i < 200; i += 1) {
      const { offset } = allocateAmount(25, new Set());
      expect(offset).toBeGreaterThanOrEqual(MIN_OFFSET);
      expect(offset).toBeLessThanOrEqual(MAX_OFFSET);
    }
  });

  it('сообщает, когда свободных сумм не осталось', () => {
    const taken = new Set<string>();
    for (let offset = MIN_OFFSET; offset <= MAX_OFFSET; offset += 1) {
      taken.add(toAmountKey(buildAmount(10, offset)));
    }

    expect(() => allocateAmount(10, taken)).toThrow(AmountSpaceExhaustedError);
  });
});

describe('transferAmountKey', () => {
  it('переводит ончейн-сумму USDT в ключ заказа', () => {
    expect(transferAmountKey('10030400')).toBe('10.0304');
    expect(transferAmountKey('25000100')).toBe('25.0001');
    expect(transferAmountKey('40999900')).toBe('40.9999');
  });

  it('отбрасывает пыль ниже нашего шага, а не округляет вверх', () => {
    // 10.030499 — это всё ещё платёж по заказу 10.0304, а не по 10.0305.
    expect(transferAmountKey('10030499')).toBe('10.0304');
    expect(transferAmountKey('10030500')).toBe('10.0305');
  });

  it('переживает большие суммы без потери точности', () => {
    expect(transferAmountKey('123456789012345')).toBe('123456789.0123');
  });

  it('учитывает токены с другим числом знаков', () => {
    expect(transferAmountKey('100304', 4)).toBe('10.0304');
    expect(transferAmountKey('1003040000000000000', 18)).toBe('1.0030');
  });

  it('не падает на мусоре', () => {
    expect(transferAmountKey('не число')).toBe('0.0000');
    expect(transferAmountKey('-5')).toBe('0.0000');
  });
});
