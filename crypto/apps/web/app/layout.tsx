import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Unbounded } from 'next/font/google';
import './globals.css';
import { MotionConfig } from 'framer-motion';
import { SmoothScroll } from './components/smooth-scroll';
import { CrosshairCursor } from './components/effects/crosshair-cursor';
import { ScrollProgress } from './components/effects/scroll-progress';

// Display face for headings: heavy, wide, full Cyrillic coverage.
const display = Unbounded({
  subsets: ['cyrillic', 'latin'],
  weight: ['700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
});

const TITLE = 'CRYPTO SPHEERE — обучение торговле криптовалютой';
const DESCRIPTION =
  'Базовый, средний и продвинутый курсы по криптовалютам. Выберите уровень в Telegram-боте и получите материалы сразу после оплаты.';

// Домен нужен, чтобы og:image уехал абсолютной ссылкой. Он же — единственное,
// что отличает сборки под разные хосты, поэтому берётся из окружения:
// NEXT_PUBLIC_SITE_URL=https://ваш-домен npm run build --workspace apps/web
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3030';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'CRYPTO SPHEERE',
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
