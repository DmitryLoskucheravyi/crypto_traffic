'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ApiError,
  BotState,
  Course,
  RoadmapStage,
  SiteContent,
  fetchBotStatus,
  fetchCourses,
  fetchRoadmap,
  fetchSiteContent,
} from '../lib/api';
import { clearToken } from '../lib/auth';
import { Skeleton } from '../components/ui/panel';

type Data = {
  courses: Course[];
  stages: RoadmapStage[];
  content: SiteContent;
  bot: BotState | null;
};

const BOT_MODE_LABELS: Record<string, string> = {
  off: 'Вимкнено',
  approve: 'З підтвердженням',
  auto: 'Автоматично',
};

const Tile = ({
  label,
  value,
  hint,
  href,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  href: string;
  tone?: 'default' | 'muted' | 'warn';
}) => (
  <Link
    href={href}
    className="panel group rounded-xl p-5 transition-colors duration-150 hover:border-accent/30"
  >
    <span className="label">{label}</span>
    <p
      className={`mt-3 font-mono text-2xl tabular-nums ${
        tone === 'muted' ? 'text-ink-muted' : tone === 'warn' ? 'text-warn' : 'text-accent'
      }`}
    >
      {value}
    </p>
    {hint && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
  </Link>
);

export default function OverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      // The bot lives behind its own service; if it is down the rest of the
      // overview still has to render, so it resolves to null instead of
      // failing the whole page.
      const [courses, stages, content, bot] = await Promise.all([
        fetchCourses(),
        fetchRoadmap(),
        fetchSiteContent(),
        fetchBotStatus().catch(() => null),
      ]);
      setData({ courses, stages, content, bot });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.replace('/login');
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Не вдалося завантажити дані');
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="text-sm text-danger">{error}</p>;

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const activeCourses = data.courses.filter((c) => c.active);
  const prices = activeCourses.map((c) => c.price).sort((a, b) => a - b);
  const activeStages = data.stages.filter((s) => s.active);
  const lessons = activeStages.reduce((sum, s) => sum + s.lessonsCount, 0);

  const blocks = [
    { key: 'calculator', label: 'Калькулятор', on: data.content.calculator.enabled },
    { key: 'counters', label: 'Лічильники', on: data.content.counters.enabled },
    { key: 'comparison', label: 'Порівняння', on: data.content.comparison.enabled },
    { key: 'lessonPreview', label: "Прев'ю уроку", on: data.content.lessonPreview.enabled },
    { key: 'ticker', label: 'Тікер', on: data.content.ticker.enabled },
  ];
  const blocksOn = blocks.filter((b) => b.on).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Активні курси"
          value={`${activeCourses.length} / ${data.courses.length}`}
          hint={
            prices.length
              ? `${prices[0]}—${prices[prices.length - 1]} ${activeCourses[0]?.currency ?? ''}`
              : 'Немає активних курсів'
          }
          href="/courses"
          tone={activeCourses.length ? 'default' : 'warn'}
        />
        <Tile
          label="Етапи курсу"
          value={`${activeStages.length}`}
          hint={activeStages.length ? `${lessons} уроків усього` : 'Секції немає на сайті'}
          href="/roadmap"
          tone={activeStages.length ? 'default' : 'muted'}
        />
        <Tile
          label="Блоки контенту"
          value={`${blocksOn} / ${blocks.length}`}
          hint="Увімкнені блоки лендінгу"
          href="/content"
          tone={blocksOn ? 'default' : 'muted'}
        />
        <Tile
          label="Канал-бот"
          value={data.bot ? BOT_MODE_LABELS[data.bot.mode] ?? data.bot.mode : 'Недоступний'}
          hint={
            data.bot?.nextRunAt
              ? `Наступний пост ${new Date(data.bot.nextRunAt).toLocaleString('uk-UA', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : data.bot
                ? 'Розклад не заданий'
                : 'Сервіс не відповідає'
          }
          href="/channel-bot"
          tone={data.bot ? (data.bot.mode === 'off' ? 'muted' : 'default') : 'warn'}
        />
      </div>

      <section className="panel rounded-xl p-6">
        <h2 className="font-medium">Що зараз бачить відвідувач</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Вимкнений або незаповнений блок на сайті не показується взагалі.
        </p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {blocks.map((block) => (
            <li
              key={block.key}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                block.on
                  ? 'border-accent/30 text-ink'
                  : 'border-ink/10 text-ink-muted line-through decoration-ink-muted/40'
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${block.on ? 'bg-accent' : 'bg-ink/25'}`}
              />
              {block.label}
            </li>
          ))}
        </ul>

        {data.content.counters.enabled && data.content.counters.updatedAt && (
          <p className="mt-5 text-xs text-ink-muted">
            Лічильники підтверджені{' '}
            {new Date(data.content.counters.updatedAt).toLocaleDateString('uk-UA')} — числа
            статичні, оновлюйте їх вручну.
          </p>
        )}
      </section>

      {data.bot?.pendingDraft && (
        <Link
          href="/channel-bot"
          className="panel block rounded-xl border-warn/30 p-5 transition-colors hover:border-warn/50"
        >
          <span className="label text-warn">Потребує уваги</span>
          <p className="mt-2 text-sm">Чернетка поста чекає на підтвердження.</p>
        </Link>
      )}
    </div>
  );
}
