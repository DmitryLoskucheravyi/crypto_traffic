'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ApiError,
  BotHistoryItem,
  BotMode,
  BotState,
  fetchBotHistory,
  fetchBotStatus,
  postNow,
  publishDraft,
  regenerateDraft,
  rejectDraft,
  setBotMode,
} from '../../lib/api';
import { clearToken } from '../../lib/auth';

const MODE_LABELS: Record<BotMode, string> = {
  off: 'Вимкнено',
  approve: 'З підтвердженням',
  auto: 'Автопублікація',
};

const STATUS_LABELS: Record<BotHistoryItem['status'], string> = {
  published: 'Опубліковано',
  pending: 'На розгляді',
  rejected: 'Відхилено',
  failed: 'Помилка',
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('uk-UA');
}

export default function ChannelBotPage() {
  const router = useRouter();
  const [state, setState] = useState<BotState | null>(null);
  const [history, setHistory] = useState<BotHistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    Promise.all([fetchBotStatus(), fetchBotHistory(20)])
      .then(([s, h]) => {
        setState(s);
        setHistory(h);
        setError(null);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          router.replace('/login');
          return;
        }
        setError(err instanceof ApiError ? err.message : "Не вдалося з'єднатись із бот-API");
      });
  };

  useEffect(load, [router]);

  const run = async (key: string, action: () => Promise<BotState>) => {
    setBusy(key);
    try {
      await action();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Дія не виконана');
    } finally {
      setBusy(null);
    }
  };

  const onReject = () => {
    if (!window.confirm('Відхилити чернетку без публікації?')) return;
    run('reject', rejectDraft);
  };

  if (error && !state) {
    return <p className="text-danger">{error}</p>;
  }

  if (!state) {
    return <p className="text-sm text-ink-muted">Завантаження...</p>;
  }

  return (
    <div className="space-y-6">
      <p className="max-w-xl text-sm text-ink-muted">
        Автопостинг у Telegram-канал: режим, чернетки та історія публікацій.
      </p>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="panel rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="block text-ink-muted">Режим</span>
            <span className="font-mono text-accent">{MODE_LABELS[state.mode]}</span>
          </div>
          <div>
            <span className="block text-ink-muted">Наступний запуск</span>
            <span className="font-mono">{formatDate(state.nextRunAt)}</span>
          </div>
          <div>
            <span className="block text-ink-muted">Останній запуск</span>
            <span className="font-mono">{formatDate(state.lastRunAt)}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(Object.keys(MODE_LABELS) as BotMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => run(`mode:${mode}`, () => setBotMode(mode))}
              disabled={busy !== null}
              className={`rounded-md px-4 py-2 text-sm font-medium border transition-colors disabled:opacity-50 ${
                state.mode === mode
                  ? 'bg-accent text-bg border-accent'
                  : 'border-ink/15 text-ink-muted hover:text-ink hover:border-ink/30'
              }`}
            >
              {busy === `mode:${mode}` ? '...' : MODE_LABELS[mode]}
            </button>
          ))}
        </div>

        <button
          onClick={() => run('post-now', postNow)}
          disabled={busy !== null}
          className="mt-5 rounded-md bg-accent text-bg font-medium px-5 py-2.5 disabled:opacity-50"
        >
          {busy === 'post-now' ? 'Генерую допис...' : '⏳ Запустити зараз'}
        </button>
      </div>

      {state.pendingDraft && (
        <div className="panel rounded-xl p-6">
          <h2 className="text-lg font-semibold">Чернетка на розгляді</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-ink/90 rounded-md bg-bg border border-ink/10 p-4">
            {state.pendingDraft}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => run('publish', publishDraft)}
              disabled={busy !== null}
              className="rounded-md bg-accent px-4 py-2 font-medium text-bg transition-colors hover:bg-accent/90 disabled:opacity-50"
            >
              {busy === 'publish' ? '...' : '✅ Опублікувати'}
            </button>
            <button
              onClick={() => run('regenerate', regenerateDraft)}
              disabled={busy !== null}
              className="rounded-md border border-ink/15 px-4 py-2 text-ink-muted transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
            >
              {busy === 'regenerate' ? '...' : '🔁 Перегенерувати'}
            </button>
            <button
              onClick={onReject}
              disabled={busy !== null}
              className="rounded-md border border-danger/40 text-danger px-4 py-2 disabled:opacity-50"
            >
              {busy === 'reject' ? '...' : '❌ Відхилити'}
            </button>
          </div>
        </div>
      )}

      <div className="panel rounded-xl p-6">
        <h2 className="text-lg font-semibold">Історія</h2>
        {!history || history.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Історія порожня.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink/10">
            {history.map((item) => (
              <li key={item.id} className="py-3 text-sm">
                <div className="flex items-center gap-3 text-xs text-ink-muted">
                  <span className="font-mono">{formatDate(item.createdAt)}</span>
                  <span>
                    {item.trigger}/{item.mode}
                  </span>
                  <span
                    className={
                      item.status === 'failed' || item.status === 'rejected'
                        ? 'text-danger'
                        : 'text-accent'
                    }
                  >
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
                <p className="mt-1 text-ink/80">
                  {item.content ? item.content.slice(0, 160) : '(без тексту)'}
                  {item.content && item.content.length > 160 ? '…' : ''}
                </p>
                {item.error && <p className="mt-1 text-xs text-danger">{item.error}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
