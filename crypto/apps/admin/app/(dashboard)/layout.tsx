'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getToken, clearToken } from '../lib/auth';
import { NAV, Nav } from '../components/nav';
import { Button } from '../components/ui/button';
import { ToastProvider } from '../components/ui/toast';
import { ConfirmProvider } from '../components/ui/confirm';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3030';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

  // Navigating on a phone should close the drawer behind you.
  useEffect(() => setMenuOpen(false), [pathname]);

  const logout = () => {
    clearToken();
    router.replace('/login');
  };

  if (!ready) return null;

  const current = NAV.find((item) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
  );

  const sidebar = (
    <>
      <div className="flex items-center gap-2.5 px-3">
        <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
          Адмінка
        </span>
      </div>
      <div className="mt-6">
        <Nav onNavigate={() => setMenuOpen(false)} />
      </div>
      <div className="mt-auto flex flex-col gap-1 px-1">
        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
        >
          Відкрити лендінг ↗
        </a>
        <button
          onClick={logout}
          className="rounded-lg px-3 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
        >
          Вийти
        </button>
      </div>
    </>
  );

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="flex min-h-screen">
          {/* Desktop rail */}
          <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink/8 bg-surface py-6 lg:flex">
            {sidebar}
          </aside>

          {/* Phone drawer */}
          {menuOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
                onClick={() => setMenuOpen(false)}
              />
              <aside className="relative flex h-full w-64 flex-col border-r border-ink/8 bg-surface py-6">
                {sidebar}
              </aside>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-ink/8 bg-bg/90 px-6 py-4 backdrop-blur">
              <Button
                variant="quiet"
                size="sm"
                className="lg:hidden"
                onClick={() => setMenuOpen(true)}
                aria-label="Меню"
              >
                ☰
              </Button>
              <h1 className="text-lg font-medium">{current?.label ?? 'Адмінка'}</h1>
            </header>

            <main className="mx-auto w-full max-w-container flex-1 px-6 py-8">{children}</main>
          </div>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
