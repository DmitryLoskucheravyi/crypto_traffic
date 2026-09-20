'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Inline, not an icon package: five glyphs do not justify a dependency.
const ICONS: Record<string, React.ReactNode> = {
  overview: (
    <>
      <rect x="2.5" y="2.5" width="5" height="5" rx="1" />
      <rect x="10.5" y="2.5" width="5" height="5" rx="1" />
      <rect x="2.5" y="10.5" width="5" height="5" rx="1" />
      <rect x="10.5" y="10.5" width="5" height="5" rx="1" />
    </>
  ),
  courses: (
    <>
      <path d="M3 4.5h12M3 9h12M3 13.5h7" />
    </>
  ),
  roadmap: (
    <>
      <path d="M4 15V9a2 2 0 0 1 2-2h6a2 2 0 0 0 2-2V3" />
      <circle cx="4" cy="15" r="1.6" />
      <circle cx="14" cy="3" r="1.6" />
    </>
  ),
  content: (
    <>
      <rect x="2.5" y="3" width="13" height="12" rx="1.5" />
      <path d="M2.5 7h13M6.5 7v8" />
    </>
  ),
  bot: (
    <>
      <rect x="3" y="6" width="12" height="9" rx="2" />
      <path d="M9 6V3M6.5 10.5h.01M11.5 10.5h.01" />
    </>
  ),
};

export const NAV = [
  { href: '/', label: 'Огляд', icon: 'overview' },
  { href: '/courses', label: 'Курси', icon: 'courses' },
  { href: '/roadmap', label: 'Дорожня карта', icon: 'roadmap' },
  { href: '/content', label: 'Контент сайту', icon: 'content' },
  { href: '/channel-bot', label: 'Канал-бот', icon: 'bot' },
];

export const Nav = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
              active ? 'bg-accent/10 text-accent' : 'text-ink-muted hover:bg-ink/5 hover:text-ink'
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              className="shrink-0"
              aria-hidden="true"
            >
              {ICONS[item.icon]}
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};
