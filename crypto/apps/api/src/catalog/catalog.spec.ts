import { CATALOG, TIERS, findCourse, isTier } from './catalog';

describe('каталог курсов', () => {
  it('состоит ровно из трёх уровней в порядке возрастания', () => {
    expect(CATALOG.map((c) => c.tier)).toEqual(['basic', 'medium', 'advanced']);
  });

  it('держит цены, о которых договорились: 10 / 25 / 40 USDT', () => {
    expect(CATALOG.map((c) => c.priceUsdt)).toEqual([10, 25, 40]);
  });

  it('называет цену в подписи кнопки — её человек видит первой', () => {
    for (const course of CATALOG) {
      expect(course.buttonLabel).toContain(String(course.priceUsdt));
      expect(course.buttonLabel).toContain('USDT');
    }
  });

  it('у каждого уровня есть описание и состав', () => {
    for (const course of CATALOG) {
      expect(course.title.trim()).not.toHaveLength(0);
      expect(course.description.trim()).not.toHaveLength(0);
      expect(course.includes.length).toBeGreaterThan(0);
    }
  });

  it('находит курс по уровню и отсеивает мусор', () => {
    expect(findCourse('medium')?.priceUsdt).toBe(25);
    expect(findCourse('platinum')).toBeUndefined();

    expect(TIERS.every(isTier)).toBe(true);
    expect(isTier('platinum')).toBe(false);
  });
});
