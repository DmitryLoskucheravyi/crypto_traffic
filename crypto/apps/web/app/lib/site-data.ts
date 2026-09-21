// Снимок контента, который раньше жил в Mongo и редактировался из админки.
// Админки больше нет: лендинг собирается статически, и этот файл — его
// единственный источник данных. Правки контента = правка этого файла + деплой.

export type CourseTier = 'basic' | 'medium' | 'advanced';

// Цена на лендинге не показывается сознательно: стоимость и оплата живут
// только в боте, поэтому здесь её просто нет — нечему разъезжаться.
export type Course = {
  tier: CourseTier;
  title: string;
  description: string;
};

export type RoadmapStage = {
  id: string;
  order: number;
  title: string;
  lessonsCount: number;
  hasTest: boolean;
  summary: string;
  modules: string[];
  imageUrl: string;
};

export type CalculatorTier = { tier: CourseTier; lowPct: number; highPct: number };

export type Calculator = {
  amountMin: number;
  amountMax: number;
  amountStep: number;
  currency: string;
  horizonMonths: number;
  tiers: CalculatorTier[];
  disclaimer: string;
};

export type Counters = {
  studentsTotal: number | null;
  seatsLeft: number | null;
  note: string;
  /** ISO-дата, когда цифры последний раз подтверждались. */
  updatedAt: string | null;
};

export type Comparison = {
  leftTitle: string;
  rightTitle: string;
  rows: Array<{ label: string; left: string; right: string }>;
};

export const BOT_USERNAME = 'crypto_course_sell_bot';
export const BOT_URL = `https://t.me/${BOT_USERNAME}`;

export const courses: Course[] = [
  {
    tier: 'basic',
    title: 'Базовый курс',
    description:
      'Старт с нуля: как устроен крипторынок, биржи и кошельки, первые сделки без лишнего риска.',
  },
  {
    tier: 'medium',
    title: 'Средний курс',
    description:
      'Анализ рынка: работа с графиком, ликвидность, торговые стратегии и управление риском.',
  },
  {
    tier: 'advanced',
    title: 'Продвинутый курс',
    description:
      'Своя торговая система: дисциплина, разбор собственных сделок и портфельные стратегии.',
  },
];

export const roadmapStages: RoadmapStage[] = [
  {
    id: 'stage-1',
    order: 1,
    title: 'Введение в рынки',
    lessonsCount: 5,
    hasTest: true,
    summary: 'С нуля: как устроен крипторынок и из чего складывается цена.',
    modules: [
      'Что такое крипторынок',
      'Участники и ликвидность',
      'Спот и деривативы',
      'Риск и размер капитала',
      'Как устроено обучение',
    ],
    imageUrl: '/roadmap-1.png',
  },
  {
    id: 'stage-2',
    order: 2,
    title: 'Биржи и базовая механика',
    lessonsCount: 4,
    hasTest: true,
    summary: 'Где торговать и как не потерять деньги на технике.',
    modules: [
      'Выбор биржи и верификация',
      'Кошельки и хранение',
      'Типы ордеров',
      'Комиссии и проскальзывание',
    ],
    imageUrl: '/roadmap-2.png',
  },
  {
    id: 'stage-3',
    order: 3,
    title: 'Работа с графиком',
    lessonsCount: 6,
    hasTest: true,
    summary: 'Читать движение, а не угадывать его.',
    modules: [
      'Таймфреймы',
      'Свечной анализ',
      'Уровни поддержки и сопротивления',
      'Тренд и структура',
      'Объёмы',
      'Разбор реального движения',
    ],
    imageUrl: '/roadmap-3.png',
  },
  {
    id: 'stage-4',
    order: 4,
    title: 'Ликвидность',
    lessonsCount: 4,
    hasTest: false,
    summary: 'Почему цена ходит именно туда, где больно большинству.',
    modules: ['Пулы ликвидности', 'Снятие стопов', 'Имбалансы', 'Зоны интереса'],
    imageUrl: '/roadmap-4.png',
  },
  {
    id: 'stage-5',
    order: 5,
    title: 'Инструменты трейдера',
    lessonsCount: 4,
    hasTest: false,
    summary: 'Рабочее место: что реально нужно, а что шум.',
    modules: ['TradingView и разметка', 'Скринеры', 'Журнал сделок', 'Калькулятор позиции'],
    imageUrl: '/roadmap-5.png',
  },
  {
    id: 'stage-6',
    order: 6,
    title: 'Система и дисциплина',
    lessonsCount: 5,
    hasTest: true,
    summary: 'Превращаем разрозненные знания в повторяемый процесс.',
    modules: [
      'Торговый план',
      'Управление риском',
      'Психология просадки',
      'Разбор собственных сделок',
      'Чек-лист перед входом',
    ],
    imageUrl: '/roadmap-6.png',
  },
];

export const calculator: Calculator = {
  amountMin: 100,
  amountMax: 10000,
  amountStep: 100,
  currency: 'USD',
  horizonMonths: 12,
  tiers: [
    { tier: 'advanced', lowPct: 600, highPct: 1200 },
    { tier: 'medium', lowPct: 330, highPct: 513 },
    { tier: 'basic', lowPct: 145, highPct: 264 },
  ],
  disclaimer:
    'Иллюстративный расчёт по фиксированным коэффициентам. Не является финансовой рекомендацией, прогнозом или гарантией доходности. Торговля сопряжена с риском потери капитала.',
};

export const counters: Counters = {
  studentsTotal: 240,
  seatsLeft: 10,
  note: 'мест открыто на этой неделе',
  updatedAt: '2026-09-20T21:00:31.518Z',
};

export const comparison: Comparison = {
  leftTitle: 'Сам по видео с YouTube',
  rightTitle: 'Курс',
  rows: [
    {
      label: 'Структура',
      left: 'Ролики в случайном порядке, пробелы не видны',
      right: 'Этапы идут по порядку, каждый закрывает конкретный пробел',
    },
    {
      label: 'Актуальность',
      left: 'Видео двухлетней давности с мёртвыми примерами',
      right: 'Программа пересматривается под текущий рынок',
    },
    {
      label: 'Поддержка',
      left: 'Вопрос в комментарии — и тишина',
      right: 'Менеджер в Telegram отвечает по материалам',
    },
    {
      label: 'Практика',
      left: 'Теория без разбора собственных сделок',
      right: 'Разбор реальных рыночных ситуаций',
    },
    {
      label: 'Проверка себя',
      left: 'Непонятно, усвоил ты тему или нет',
      right: 'Тестирование в конце этапов',
    },
  ],
};

export const ticker: string[] = [
  'Структура рынка',
  'Ликвидность',
  'Свечной анализ',
  'Управление риском',
  'Торговый план',
  'Журнал сделок',
  'Зоны интереса',
  'Психология просадки',
  'Разбор сделок',
  'Тестирование',
];
