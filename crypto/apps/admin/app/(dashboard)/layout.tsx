'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, clearToken } from '../lib/auth';
import { TabNav } from '../components/tab-nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

  const logout = () => {
    clearToken();
    router.replace('/login');
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10">
        <div className="max-w-container mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-mono text-sm uppercase tracking-wide text-accent">
            Крипто — Адмінка
          </span>
          <button onClick={logout} className="text-sm text-ink-muted hover:text-ink">
            Вийти
          </button>
        </div>
        <div className="max-w-container mx-auto px-6">
          <TabNav />
        </div>
      </header>

      <main className="max-w-container mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
