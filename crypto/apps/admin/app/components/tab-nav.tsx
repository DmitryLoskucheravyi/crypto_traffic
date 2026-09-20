'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Курси' },
  { href: '/roadmap', label: 'Дорожня карта' },
  { href: '/content', label: 'Контент сайту' },
  { href: '/channel-bot', label: 'Канал-бот' },
];

export const TabNav = () => {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-ink/10">
      {TABS.map((tab) => {
        const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active
                ? 'border-accent text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};
