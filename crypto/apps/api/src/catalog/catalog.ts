// Каталог курсов. Раньше он лежал в Mongo и правился из админки — админки
// больше нет, поэтому каталог живёт в коде: три уровня, три цены, никаких
// миграций. Лендинг показывает те же три уровня (apps/web/app/lib/site-data.ts),
// но БЕЗ цены: цена существует только здесь и в боте.

export const TIERS = ['basic', 'medium', 'advanced'] as const;

export type CourseTier = (typeof TIERS)[number];

export type Course = {
  tier: CourseTier;
  title: string;
  /** Короткая подпись для кнопки в меню бота. */
  buttonLabel: string;
  description: string;
  /** Цена в USDT. Оплата всегда в USDT TRC20, поэтому валюта одна. */
  priceUsdt: number;
  /** Что человек получает после оплаты — перечисляется в сообщении о выдаче. */
  includes: string[];
};

export const CATALOG: readonly Course[] = [
  {
    tier: 'basic',
    title: 'Базовый курс',
    buttonLabel: 'Базовый — 10 USDT',
    description:
      'Старт с нуля: как устроен крипторынок, биржи и кошельки, первые сделки без лишнего риска.',
    priceUsdt: 10,
    includes: ['Введение в рынки — 5 уроков + тест', 'Биржи и базовая механика — 4 урока + тест'],
  },
  {
    tier: 'medium',
    title: 'Средний курс',
    buttonLabel: 'Средний — 25 USDT',
    description:
      'Анализ рынка: работа с графиком, ликвидность, торговые стратегии и управление риском.',
    priceUsdt: 25,
    includes: [
      'Всё из базового курса',
      'Работа с графиком — 6 уроков + тест',
      'Ликвидность — 4 урока',
    ],
  },
  {
    tier: 'advanced',
    title: 'Продвинутый курс',
    buttonLabel: 'Продвинутый — 40 USDT',
    description:
      'Своя торговая система: дисциплина, разбор собственных сделок и портфельные стратегии.',
    priceUsdt: 40,
    includes: [
      'Всё из среднего курса',
      'Инструменты трейдера — 4 урока',
      'Система и дисциплина — 5 уроков + тест',
    ],
  },
];

export function findCourse(tier: string): Course | undefined {
  return CATALOG.find((course) => course.tier === tier);
}

export function isTier(value: string): value is CourseTier {
  return (TIERS as readonly string[]).includes(value);
}
