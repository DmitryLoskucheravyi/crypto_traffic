'use client';

import { useState } from 'react';
import { RoadmapStage, RoadmapStageDraft } from '../lib/api';

// The six generated assets that live in apps/web/public. A dropdown rather
// than a free URL field: these are the only images the section is designed
// around, and a typo here would silently break the card.
const IMAGE_OPTIONS = [
  { value: '', label: 'Без зображення' },
  ...[1, 2, 3, 4, 5, 6].map((i) => ({ value: `/roadmap-${i}.png`, label: `Об'єкт ${i}` })),
];

// Shown instead of the isometric object while the card is expanded.
const FRONT_IMAGE_OPTIONS = [
  { value: '', label: 'Без підміни' },
  ...[1, 2, 3, 4, 5, 6].map((i) => ({
    value: `/roadmap-${i}-front.png`,
    label: `Об'єкт ${i} — фронт`,
  })),
];

export const emptyDraft = (): RoadmapStageDraft => ({
  title: '',
  lessonsCount: 0,
  hasTest: false,
  summary: '',
  modules: [],
  imageUrl: '',
  imageFrontUrl: '',
  active: true,
});

const toDraft = (stage: RoadmapStage): RoadmapStageDraft => ({
  title: stage.title,
  lessonsCount: stage.lessonsCount,
  hasTest: stage.hasTest,
  summary: stage.summary ?? '',
  modules: stage.modules ?? [],
  imageUrl: stage.imageUrl ?? '',
  imageFrontUrl: stage.imageFrontUrl ?? '',
  active: stage.active,
});

type Props = {
  stage?: RoadmapStage;
  onSave: (draft: RoadmapStageDraft) => Promise<void>;
  onCancel: () => void;
};

export const RoadmapStageEditor = ({ stage, onSave, onCancel }: Props) => {
  const [form, setForm] = useState<RoadmapStageDraft>(stage ? toDraft(stage) : emptyDraft());
  const [moduleInput, setModuleInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof RoadmapStageDraft>(key: K, value: RoadmapStageDraft[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addModule = () => {
    const value = moduleInput.trim();
    if (!value) return;
    update('modules', [...form.modules, value]);
    setModuleInput('');
  };

  const moveModule = (index: number, delta: number) => {
    const next = [...form.modules];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update('modules', next);
  };

  const submit = async () => {
    if (!form.title.trim()) {
      setError('Назва не може бути порожньою');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...form, title: form.title.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setSaving(false);
    }
  };

  const field = 'mt-1 w-full rounded-md bg-bg border border-ink/15 px-3 py-2 outline-none focus:border-accent';

  return (
    <div className="panel rounded-lg p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wide text-accent">
          {stage ? `Етап ${stage.order}` : 'Новий етап'}
        </span>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => update('active', e.target.checked)}
            className="accent-accent"
          />
          Активний
        </label>
      </div>

      <label className="block mt-4 text-sm text-ink-muted">Назва</label>
      <input value={form.title} onChange={(e) => update('title', e.target.value)} className={field} />

      <label className="block mt-4 text-sm text-ink-muted">Короткий опис (необов&apos;язково)</label>
      <textarea
        value={form.summary}
        onChange={(e) => update('summary', e.target.value)}
        rows={2}
        className={`${field} resize-none`}
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-ink-muted">Кількість уроків</label>
          <input
            type="number"
            min={0}
            value={form.lessonsCount}
            onChange={(e) => update('lessonsCount', Number(e.target.value))}
            className={`${field} font-mono`}
          />
        </div>
        <div>
          <label className="block text-sm text-ink-muted">Зображення</label>
          <select
            value={form.imageUrl}
            onChange={(e) => update('imageUrl', e.target.value)}
            className={field}
          >
            {IMAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label className="block text-sm text-ink-muted">Зображення при розкритті</label>
        <select
          value={form.imageFrontUrl}
          onChange={(e) => update('imageFrontUrl', e.target.value)}
          className={field}
        >
          {FRONT_IMAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 mt-4 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={form.hasTest}
          onChange={(e) => update('hasTest', e.target.checked)}
          className="accent-accent"
        />
        Є тестування
      </label>

      <label className="block mt-5 text-sm text-ink-muted">Теми всередині етапу</label>
      <div className="mt-1 flex gap-2">
        <input
          value={moduleInput}
          onChange={(e) => setModuleInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addModule();
            }
          }}
          placeholder="Назва теми"
          className={`${field} mt-0`}
        />
        <button
          type="button"
          onClick={addModule}
          className="shrink-0 rounded-md border border-ink/15 px-4 text-sm hover:border-accent"
        >
          Додати
        </button>
      </div>

      {form.modules.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {form.modules.map((module, i) => (
            <li key={`${module}-${i}`} className="flex items-center gap-2 text-sm">
              <span className="font-mono text-xs text-ink-muted w-6">{i + 1}.</span>
              <span className="flex-1">{module}</span>
              <button
                type="button"
                onClick={() => moveModule(i, -1)}
                disabled={i === 0}
                className="px-2 text-ink-muted hover:text-ink disabled:opacity-30"
                aria-label="Вгору"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveModule(i, 1)}
                disabled={i === form.modules.length - 1}
                className="px-2 text-ink-muted hover:text-ink disabled:opacity-30"
                aria-label="Вниз"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => update('modules', form.modules.filter((_, j) => j !== i))}
                className="px-2 text-ink-muted hover:text-ink"
                aria-label="Видалити"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={saving}
          className="rounded-md bg-accent text-bg font-medium px-5 py-2.5 disabled:opacity-50"
        >
          {saving ? 'Збереження...' : 'Зберегти'}
        </button>
        <button onClick={onCancel} className="text-sm text-ink-muted hover:text-ink">
          Скасувати
        </button>
      </div>
    </div>
  );
};
