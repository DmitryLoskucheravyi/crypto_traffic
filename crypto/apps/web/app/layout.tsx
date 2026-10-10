import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Unbounded } from 'next/font/google';
import './globals.css';
import { MotionConfig } from 'framer-motion';
import { SmoothScroll } from './components/smooth-scroll';
import { CrosshairCursor } from './components/effects/crosshair-cursor';
import { ScrollProgress } from './components/effects/scroll-progress';
import { SITE_URL } from './lib/config';
import { buildStructuredData } from './lib/structured-data';

// Display face for headings: heavy, wide, full Cyrillic coverage.
const display = Unbounded({
  subsets: ['cyrillic', 'latin'],
  weight: ['700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
});

// Ключевой запрос стоит первым: в выдаче и на вкладке браузера хвост обрезается
// раньше начала, и бренд в конце теряется легче, чем тема.
// Эта же строка уходит в og:title, twitter:title и в name у WebPage в Schema.org.
const TITLE = 'Крипто трейдинг — обучение с нуля | CRYPTO SPHEERE';
const DESCRIPTION =
  'Базовый, средний и продвинутый курсы по криптовалютам. Выберите уровень в Telegram-боте и получите материалы сразу после оплаты.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  // Одна страница доступна по десятку адресов сразу: с www и без, со слешем и
  // без, с utm-хвостами из рекламы. Canonical склеивает их в один адрес,
  // чтобы вес не размазывался по дублям.
  alternates: { canonical: '/' },
  applicationName: 'CRYPTO SPHEERE',
  authors: [{ name: 'CRYPTO SPHEERE' }],
  creator: 'CRYPTO SPHEERE',
  publisher: 'CRYPTO SPHEERE',
  category: 'education',
  // Телефонов на странице нет, а Safari охотно превращает в ссылки цифры из
  // калькулятора и счётчиков — выключаем.
  formatDetection: { telephone: false, address: false, email: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Без этого Google показывает в выдаче микропревью и обрезает описание.
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: `${SITE_URL}/`,
    siteName: 'CRYPTO SPHEERE',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

// viewport-fit=cover — чтобы hero на 100dvh занимал экран целиком под вырезом
// iPhone; масштабирование намеренно не запрещаем.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B0B0D',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${GeistSans.variable} ${GeistMono.variable} ${display.variable}`}>
      <body>
        {/* Граф Schema.org. Лежит в разметке страницы, а не в <head>, потому что
            поисковику всё равно, а здесь он не задерживает первую отрисовку. */}
        <script
          type="application/ld+json"
          // Данные свои и статичные — это сериализация нашего же content.ts,
          // пользовательский ввод сюда не попадает.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildStructuredData(TITLE, DESCRIPTION)).replace(
              /</g,
              '\\u003c',
            ),
          }}
        />
        <ScrollProgress />
        <CrosshairCursor />
        <MotionConfig reducedMotion="user">
          <SmoothScroll>{children}</SmoothScroll>
        </MotionConfig>
        {/* Grain sits above the sections but below the cursor, and never
            takes pointer events. */}
        <div className="grain-overlay" aria-hidden="true" />
      </body>
    </html>
  );
}
