import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Unbounded } from 'next/font/google';
import './globals.css';
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

export const metadata: Metadata = {
  title: 'Крипто курсы — обучение торговле криптовалютой',
  description:
    'Базовый, средний и продвинутый курсы по криптовалютам. Выберите уровень и получите стоимость в Telegram-боте.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${GeistSans.variable} ${GeistMono.variable} ${display.variable}`}>
      <body>
        <ScrollProgress />
        <CrosshairCursor />
        <SmoothScroll>{children}</SmoothScroll>
        {/* Grain sits above the sections but below the cursor, and never
            takes pointer events. */}
        <div className="grain-overlay" aria-hidden="true" />
      </body>
    </html>
  );
}
