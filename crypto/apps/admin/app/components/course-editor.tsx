'use client';

import { useState } from 'react';
import { Course, saveCourse, ApiError } from '../lib/api';

const TIER_LABELS: Record<Course['tier'], string> = {
  basic: 'Базовий',
  medium: 'Середній',
  advanced: 'Просунутий',
};

export const CourseEditor = ({ course }: { course: Course }) => {
  const [form, setForm] = useState(course);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const update = <K extends keyof Course>(key: K, value: Course[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await saveCourse(form);
      setForm(updated);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не вдалося зберегти');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel rounded-lg p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wide text-accent">
          {TIER_LABELS[form.tier]}
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
      <input
        value={form.title}
        onChange={(e) => update('title', e.target.value)}
        className="mt-1 w-full rounded-md bg-bg border border-ink/15 px-3 py-2 outline-none focus:border-accent"
      />

      <label className="block mt-4 text-sm text-ink-muted">Опис</label>
      <textarea
        value={form.description}
        onChange={(e) => update('description', e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-md bg-bg border border-ink/15 px-3 py-2 outline-none focus:border-accent resize-none"
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-ink-muted">Ціна</label>
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => update('price', Number(e.target.value))}
            className="mt-1 w-full rounded-md bg-bg border border-ink/15 px-3 py-2 outline-none focus:border-accent font-mono"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-muted">Валюта</label>
          <input
            value={form.currency}
            onChange={(e) => update('currency', e.target.value.toUpperCase())}
            className="mt-1 w-full rounded-md bg-bg border border-ink/15 px-3 py-2 outline-none focus:border-accent font-mono"
          />
        </div>
      </div>

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
    </div>
  );
};
