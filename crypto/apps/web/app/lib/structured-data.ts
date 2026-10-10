import { content } from './content';
import { SITE_URL, config } from './config';
import { courses, roadmapStages } from './site-data';

// Разметка Schema.org одним графом: поисковик видит, что страница — это
// организация, её сайт, три курса и блок вопросов, а не просто мешок текста.
// Источник данных тот же, что у вёрстки (content.ts / site-data.ts), поэтому
// разметка не может разъехаться с тем, что реально написано на странице.

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const WEBPAGE_ID = `${SITE_URL}/#webpage`;

const organization = {
  '@type': 'EducationalOrganization',
  '@id': ORGANIZATION_ID,
  name: content.brand,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/logo-mark.png`,
  description: content.footer.note,
  // sameAs — то, по чему поисковик связывает сайт с аккаунтами в сетях и понимает,
  // что это один и тот же бренд. Незаданные ссылки выпадают из списка:
  // null в разметке хуже, чем отсутствующее поле.
  sameAs: [config.bot, config.channel, config.instagram].flatMap((link) =>
    link ? [link.url] : [],
  ),
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    url: config.bot.url,
    name: `@${config.bot.username}`,
    availableLanguage: ['ru'],
  },
};

const website = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${SITE_URL}/`,
  name: content.brand,
  inLanguage: 'ru-RU',
  publisher: { '@id': ORGANIZATION_ID },
};

const webPage = (title: string, description: string) => ({
  '@type': 'WebPage',
  '@id': WEBPAGE_ID,
  url: `${SITE_URL}/`,
  name: title,
  description,
  inLanguage: 'ru-RU',
  isPartOf: { '@id': WEBSITE_ID },
  about: { '@id': ORGANIZATION_ID },
  primaryImageOfPage: `${SITE_URL}/opengraph-image.png`,
});

// Каждый уровень — отдельный Course. Цены в разметке нет ровно потому, что её
// нет и на странице: стоимость живёт только в боте, и выдумывать её здесь
// означало бы показать в выдаче число, которого пользователь не увидит.
const courseList = {
  '@type': 'ItemList',
  name: content.courses.title,
  itemListElement: courses.map((course, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Course',
      '@id': `${SITE_URL}/#course-${course.tier}`,
      name: course.title,
      description: course.description,
      url: `${SITE_URL}/#courses`,
      inLanguage: 'ru',
      provider: { '@id': ORGANIZATION_ID },
      isAccessibleForFree: false,
      // Ни длительности в часах, ни расписания у курса нет — в разметке их
      // тоже нет. Указан только формат: материалы, доступные онлайн в любой
      // момент после оплаты.
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        inLanguage: 'ru',
      },
    },
  })),
};

// Программа целиком — этапы дорожной карты. Отвечает на запросы вида
// «что входит в курс по трейдингу»: список модулей уезжает в разметку ровно в
// том порядке, в каком он показан на странице.
const syllabus = {
  '@type': 'ItemList',
  name: content.roadmap.title,
  description: content.roadmap.sub,
  itemListElement: roadmapStages.map((stage) => ({
    '@type': 'ListItem',
    position: stage.order,
    name: stage.title,
    description: `${stage.summary} Модули: ${stage.modules.join(', ')}.`,
  })),
};

const faqPage = {
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/#faq`,
  name: content.faq.title,
  inLanguage: 'ru-RU',
  isPartOf: { '@id': WEBPAGE_ID },
  mainEntity: content.faq.items.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export const buildStructuredData = (title: string, description: string) => ({
  '@context': 'https://schema.org',
  '@graph': [organization, website, webPage(title, description), courseList, syllabus, faqPage],
});
