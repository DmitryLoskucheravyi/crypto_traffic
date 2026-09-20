'use client';

import { useState } from 'react';
import { Course, saveCourse, ApiError } from '../lib/api';
import { Button } from './ui/button';
import { Field, Input, Switch, Textarea } from './ui/field';
import { useToast } from './ui/toast';

const TIER_LABELS: Record<Course['tier'], string> = {
  basic: 'Базовий',
  medium: 'Середній',
  advanced: 'Просунутий',
};

export const CourseEditor = ({ course }: { course: Course }) => {
  const toast = useToast();
  const [form, setForm] = useState(course);
  const [saved, setSaved] = useState(course);
  const [saving, setSaving] = useState(false);

  // Cheap and honest: the form is dirty when it differs from what the server
  // last returned, so the indicator cannot drift out of sync with reality.
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  const update = <K extends keyof Course>(key: K, value: Course[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSave = async () => {
    setSaving(true);
    try {
      const updated = await saveCourse(form);
      setForm(updated);
      setSaved(updated);
      toast(`${TIER_LABELS[updated.tier]} курс збережено`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Не вдалося зберегти', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel flex flex-col rounded-xl p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-accent">
          {TIER_LABELS[form.tier]}
        </span>
        <Switch
          checked={form.active}
          onChange={(v) => update('active', v)}
          label={form.active ? 'Активний' : 'Прихований'}
        />
      </div>

      <Field label="Назва" className="mt-5">
        <Input value={form.title} onChange={(e) => update('title', e.target.value)} />
      </Field>

      <Field label="Опис" className="mt-4">
        <Textarea
          rows={4}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </Field>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
        <Field label="Ціна">
          <Input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => update('price', Number(e.target.value))}
            className="font-mono"
          />
        </Field>
        <Field label="Валюта">
          <Input
            value={form.currency}
            onChange={(e) => update('currency', e.target.value.toUpperCase())}
            className="w-24 font-mono"
          />
        </Field>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button variant="primary" onClick={onSave} loading={saving} disabled={!dirty}>
          Зберегти
        </Button>
        {dirty && <span className="text-xs text-warn">Є незбережені зміни</span>}
      </div>
    </div>
  );
};
