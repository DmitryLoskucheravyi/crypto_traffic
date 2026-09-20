'use client';

import { useState } from 'react';
import { RoadmapStage, RoadmapStageDraft } from '../lib/api';
import { Button } from './ui/button';
import { Field, Input, Select, Switch, Textarea } from './ui/field';

// The six generated assets that live in apps/web/public. A dropdown rather
// than a free URL field: these are the only images the section is designed
// around, and a typo here would silently break the card.
const IMAGE_OPTIONS = [
  { value: '', label: 'Без зображення' },
  ...[1, 2, 3, 4, 5, 6].map((i) => ({ value: `/roadmap-${i}.png`, label: `Об'єкт ${i}` })),
];

export const emptyDraft = (): RoadmapStageDraft => ({
  title: '',
  lessonsCount: 0,
  hasTest: false,
  summary: '',
  modules: [],
  imageUrl: '',
  active: true,
});

const toDraft = (stage: RoadmapStage): RoadmapStageDraft => ({
  title: stage.title,
  lessonsCount: stage.lessonsCount,
  hasTest: stage.hasTest,
  summary: stage.summary ?? '',
  modules: stage.modules ?? [],
  imageUrl: stage.imageUrl ?? '',
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

  return (
    <div className="panel-raised rounded-xl p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-accent">
          {stage ? `Етап ${stage.order}` : 'Новий етап'}
        </span>
        <Switch
          checked={form.active}
          onChange={(v) => update('active', v)}
          label={form.active ? 'На сайті' : 'Прихований'}
        />
      </div>

      <Field label="Назва" className="mt-5">
        <Input value={form.title} onChange={(e) => update('title', e.target.value)} />
      </Field>

      <Field label="Короткий опис" hint="Необовʼязково — один-два рядки під заголовком." className="mt-4">
        <Textarea
          value={form.summary}
          onChange={(e) => update('summary', e.target.value)}
          rows={2}
        />
      </Field>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Кількість уроків">
          <Input
            type="number"
            min={0}
            value={form.lessonsCount}
            onChange={(e) => update('lessonsCount', Number(e.target.value))}
            className="font-mono"
          />
        </Field>
        <Field label="Зображення">
          <Select value={form.imageUrl} onChange={(e) => update('imageUrl', e.target.value)}>
            {IMAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-4">
        <Switch
          checked={form.hasTest}
          onChange={(v) => update('hasTest', v)}
          label="Є тестування"
        />
      </div>

      <span className="label mt-6 block">Теми всередині етапу</span>
      <div className="mt-1.5 flex gap-2">
        <Input
          value={moduleInput}
          onChange={(e) => setModuleInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addModule();
            }
          }}
          placeholder="Назва теми, Enter — додати"
        />
        <Button variant="ghost" size="sm" onClick={addModule} className="shrink-0">
          Додати
        </Button>
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

      <div className="mt-6 flex items-center gap-3">
        <Button variant="primary" onClick={submit} loading={saving}>
          Зберегти
        </Button>
        <Button variant="quiet" onClick={onCancel}>
          Скасувати
        </Button>
      </div>
    </div>
  );
};
