'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, SiteContent, fetchSiteContent, saveSiteContent } from '../../lib/api';
import { clearToken } from '../../lib/auth';

const FIELD =
  'mt-1 w-full rounded-md bg-bg border border-ink/15 px-3 py-2 outline-none focus:border-accent';

const TIERS = [
  { value: 'basic', label: 'Базовий' },
  { value: 'medium', label: 'Середній' },
  { value: 'advanced', label: 'Просунутий' },
];

// Each block saves on its own button, but the API takes one document — the
// patch sent is just that block, so two open tabs cannot wipe each other's
// unrelated edits.
const Block = ({
  title,
  hint,
  enabled,
  onToggle,
  onSave,
  saving,
  savedAt,
  error,
  children,
}: {
  title: string;
  hint?: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  onSave: () => void;
  saving: boolean;
  savedAt: number | null;
  error: string | null;
  children: React.ReactNode;
}) => (
  <section className="panel rounded-lg p-6">
    <div className="flex items-start justify-between gap-6">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
      </div>
      <label className="flex shrink-0 items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="accent-accent"
        />
        Показувати на сайті
      </label>
    </div>

    <div className="mt-5">{children}</div>

    {error && <p className="mt-4 text-sm text-danger">{error}</p>}

    <div className="mt-5 flex items-center gap-3">
      <button
        onClick={onSave}
        disabled={saving}
        className="rounded-md bg-accent text-bg font-medium px-5 py-2.5 disabled:opacity-50"
      >
        {saving ? 'Збереження...' : 'Зберегти'}
      </button>
      {savedAt && <span className="text-sm text-ink-muted">Збережено</span>}
    </div>
  </section>
);

export default function ContentPage() {
  const router = useRouter();
  const [data, setData] = useState<SiteContent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<{ key: string; at: number } | null>(null);
  const [blockError, setBlockError] = useState<{ key: string; message: string } | null>(null);

  const handleError = useCallback(
    (err: unknown, key?: string) => {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.replace('/login');
        return;
      }
      const message = err instanceof Error ? err.message : 'Не вдалося зберегти';
      if (key) setBlockError({ key, message });
      else setLoadError(message);
    },
    [router],
  );

  useEffect(() => {
    fetchSiteContent().then(setData).catch(handleError);
  }, [handleError]);

  if (loadError) return <p className="text-danger">{loadError}</p>;
  if (!data) return <p className="text-ink-muted">Завантаження...</p>;

  const patch = <K extends keyof SiteContent>(key: K, value: Partial<SiteContent[K]>) =>
    setData((d) => (d ? { ...d, [key]: { ...d[key], ...value } } : d));

  const save = async (key: keyof SiteContent, validate?: () => string | null) => {
    const problem = validate?.();
    if (problem) {
      setBlockError({ key, message: problem });
      return;
    }
    setSavingKey(key);
    setBlockError(null);
    try {
      const updated = await saveSiteContent({ [key]: data[key] } as Partial<SiteContent>);
      setData(updated);
      setSavedKey({ key, at: Date.now() });
    } catch (err) {
      handleError(err, key);
    } finally {
      setSavingKey(null);
    }
  };

  const blockProps = (key: keyof SiteContent) => ({
    saving: savingKey === key,
    savedAt: savedKey?.key === key ? savedKey.at : null,
    error: blockError?.key === key ? blockError.message : null,
  });

  const { calculator, counters, comparison, lessonPreview, ticker } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Контент сайту</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Блоки лендінгу, які не є курсами. Вимкнений або незаповнений блок на сайті просто
          не показується.
        </p>
      </div>

      <Block
        title="Калькулятор"
        hint="Не прогноз, а ілюстрація. Відсотки задаєте ви — сайт нічого не вигадує. Без дисклеймера блок не показується."
        enabled={calculator.enabled}
        onToggle={(enabled) => patch('calculator', { enabled })}
        onSave={() =>
          save('calculator', () => {
            if (!calculator.enabled) return null;
            if (calculator.amountMax <= calculator.amountMin)
              return 'Максимальна сума має бути більшою за мінімальну';
            if (!calculator.disclaimer.trim()) return 'Дисклеймер обов&apos;язковий';
            if (calculator.tiers.some((t) => t.lowPct > t.highPct))
              return 'Нижня межа не може бути більшою за верхню';
            return null;
          })
        }
        {...blockProps('calculator')}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <label className="block text-sm text-ink-muted">Сума від</label>
            <input
              type="number"
              value={calculator.amountMin}
              onChange={(e) => patch('calculator', { amountMin: Number(e.target.value) })}
              className={`${FIELD} font-mono`}
            />
          </div>
          <div>
            <label className="block text-sm text-ink-muted">Сума до</label>
            <input
              type="number"
              value={calculator.amountMax}
              onChange={(e) => patch('calculator', { amountMax: Number(e.target.value) })}
              className={`${FIELD} font-mono`}
            />
          </div>
          <div>
            <label className="block text-sm text-ink-muted">Крок</label>
            <input
              type="number"
              value={calculator.amountStep}
              onChange={(e) => patch('calculator', { amountStep: Number(e.target.value) })}
              className={`${FIELD} font-mono`}
            />
          </div>
          <div>
            <label className="block text-sm text-ink-muted">Валюта</label>
            <input
              value={calculator.currency}
              onChange={(e) => patch('calculator', { currency: e.target.value.toUpperCase() })}
              className={`${FIELD} font-mono`}
            />
          </div>
        </div>

        <div className="mt-3 w-40">
          <label className="block text-sm text-ink-muted">Горизонт, місяців</label>
          <input
            type="number"
            min={1}
            value={calculator.horizonMonths}
            onChange={(e) => patch('calculator', { horizonMonths: Number(e.target.value) })}
            className={`${FIELD} font-mono`}
          />
        </div>

        <p className="mt-5 text-sm text-ink-muted">Діапазон за горизонт, % на рівень курсу</p>
        <div className="mt-2 space-y-2">
          {TIERS.map((tier) => {
            const row = calculator.tiers.find((t) => t.tier === tier.value);
            const setRow = (next: { lowPct?: number; highPct?: number } | null) => {
              const others = calculator.tiers.filter((t) => t.tier !== tier.value);
              patch('calculator', {
                tiers: next
                  ? [
                      ...others,
                      {
                        tier: tier.value,
                        lowPct: next.lowPct ?? row?.lowPct ?? 0,
                        highPct: next.highPct ?? row?.highPct ?? 0,
                      },
                    ]
                  : others,
              });
            };

            return (
              <div key={tier.value} className="flex items-center gap-3">
                <label className="flex w-40 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!row}
                    onChange={(e) => setRow(e.target.checked ? {} : null)}
                    className="accent-accent"
                  />
                  {tier.label}
                </label>
                <input
                  type="number"
                  disabled={!row}
                  value={row?.lowPct ?? ''}
                  onChange={(e) => setRow({ lowPct: Number(e.target.value) })}
                  placeholder="від, %"
                  className={`${FIELD} mt-0 w-28 font-mono disabled:opacity-40`}
                />
                <input
                  type="number"
                  disabled={!row}
                  value={row?.highPct ?? ''}
                  onChange={(e) => setRow({ highPct: Number(e.target.value) })}
                  placeholder="до, %"
                  className={`${FIELD} mt-0 w-28 font-mono disabled:opacity-40`}
                />
              </div>
            );
          })}
        </div>

        <label className="mt-5 block text-sm text-ink-muted">Дисклеймер</label>
        <textarea
          rows={2}
          value={calculator.disclaimer}
          onChange={(e) => patch('calculator', { disclaimer: e.target.value })}
          className={`${FIELD} resize-none`}
        />
      </Block>

      <Block
        title="Лічильники"
        hint="Тільки реальні числа. Поруч на сайті показується дата останнього збереження."
        enabled={counters.enabled}
        onToggle={(enabled) => patch('counters', { enabled })}
        onSave={() => save('counters')}
        {...blockProps('counters')}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="block text-sm text-ink-muted">Учнів на курсі</label>
            <input
              type="number"
              min={0}
              value={counters.studentsTotal ?? ''}
              onChange={(e) =>
                patch('counters', {
                  studentsTotal: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              placeholder="не показувати"
              className={`${FIELD} font-mono`}
            />
          </div>
          <div>
            <label className="block text-sm text-ink-muted">Вільних місць</label>
            <input
              type="number"
              min={0}
              value={counters.seatsLeft ?? ''}
              onChange={(e) =>
                patch('counters', {
                  seatsLeft: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              placeholder="не показувати"
              className={`${FIELD} font-mono`}
            />
          </div>
          <div>
            <label className="block text-sm text-ink-muted">Підпис до місць</label>
            <input
              value={counters.note}
              onChange={(e) => patch('counters', { note: e.target.value })}
              className={FIELD}
            />
          </div>
        </div>
      </Block>

      <Block
        title="Порівняння"
        enabled={comparison.enabled}
        onToggle={(enabled) => patch('comparison', { enabled })}
        onSave={() => save('comparison')}
        {...blockProps('comparison')}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-ink-muted">Ліва колонка</label>
            <input
              value={comparison.leftTitle}
              onChange={(e) => patch('comparison', { leftTitle: e.target.value })}
              className={FIELD}
            />
          </div>
          <div>
            <label className="block text-sm text-ink-muted">Права колонка</label>
            <input
              value={comparison.rightTitle}
              onChange={(e) => patch('comparison', { rightTitle: e.target.value })}
              className={FIELD}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {comparison.rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_1.2fr_1.2fr_auto] gap-2">
              {(['label', 'left', 'right'] as const).map((field) => (
                <input
                  key={field}
                  value={row[field]}
                  onChange={(e) =>
                    patch('comparison', {
                      rows: comparison.rows.map((r, j) =>
                        j === i ? { ...r, [field]: e.target.value } : r,
                      ),
                    })
                  }
                  className={`${FIELD} mt-0`}
                />
              ))}
              <button
                onClick={() =>
                  patch('comparison', { rows: comparison.rows.filter((_, j) => j !== i) })
                }
                className="px-2 text-ink-muted hover:text-ink"
                aria-label="Видалити рядок"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() =>
            patch('comparison', {
              rows: [...comparison.rows, { label: '', left: '', right: '' }],
            })
          }
          className="mt-3 rounded-md border border-ink/15 px-4 py-2 text-sm hover:border-accent"
        >
          Додати рядок
        </button>
      </Block>

      <Block
        title="Прев'ю уроку"
        hint="Якщо це не справжній кадр з уроку, залиште позначку «ілюстрація»."
        enabled={lessonPreview.enabled}
        onToggle={(enabled) => patch('lessonPreview', { enabled })}
        onSave={() => save('lessonPreview')}
        {...blockProps('lessonPreview')}
      >
        <label className="block text-sm text-ink-muted">Заголовок</label>
        <input
          value={lessonPreview.title}
          onChange={(e) => patch('lessonPreview', { title: e.target.value })}
          className={FIELD}
        />

        <label className="mt-4 block text-sm text-ink-muted">Опис</label>
        <textarea
          rows={3}
          value={lessonPreview.description}
          onChange={(e) => patch('lessonPreview', { description: e.target.value })}
          className={`${FIELD} resize-none`}
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-ink-muted">
              Шлях до зображення (файл у apps/web/public)
            </label>
            <input
              value={lessonPreview.mediaUrl}
              onChange={(e) => patch('lessonPreview', { mediaUrl: e.target.value })}
              placeholder="/lesson-preview.png"
              className={`${FIELD} font-mono`}
            />
          </div>
          <div>
            <label className="block text-sm text-ink-muted">Опис зображення (alt)</label>
            <input
              value={lessonPreview.mediaAlt}
              onChange={(e) => patch('lessonPreview', { mediaAlt: e.target.value })}
              className={FIELD}
            />
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={lessonPreview.isIllustrative}
            onChange={(e) => patch('lessonPreview', { isIllustrative: e.target.checked })}
            className="accent-accent"
          />
          Це ілюстрація, а не справжній кадр
        </label>
      </Block>

      <Block
        title="Тікер"
        hint="Рядки бігучої стрічки. Не котирування — слова курсу, назви модулів, статуси."
        enabled={ticker.enabled}
        onToggle={(enabled) => patch('ticker', { enabled })}
        onSave={() => save('ticker')}
        {...blockProps('ticker')}
      >
        <textarea
          rows={4}
          value={ticker.items.join('\n')}
          onChange={(e) =>
            patch('ticker', {
              items: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
            })
          }
          placeholder={'Один рядок — один елемент стрічки'}
          className={`${FIELD} resize-none font-mono text-sm`}
        />
      </Block>
    </div>
  );
}
