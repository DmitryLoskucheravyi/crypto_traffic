import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { SmoothScroll } from './components/smooth-scroll';

export const metadata: Metadata = {
  title: 'Крипто курси — навчання торгівлі криптовалютою',
  description:
    'Базовий, середній та просунутий курси з криптовалют. Оберіть рівень і отримайте вартість у Telegram-боті.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
