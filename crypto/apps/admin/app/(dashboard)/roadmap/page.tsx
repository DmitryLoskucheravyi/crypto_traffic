'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ApiError,
  RoadmapStage,
  RoadmapStageDraft,
  createStage,
  deleteStage,
  fetchRoadmap,
  reorderStages,
  updateStage,
} from '../../lib/api';
import { clearToken } from '../../lib/auth';
import { RoadmapStageEditor } from '../../components/roadmap-stage-editor';
import { Button } from '../../components/ui/button';
import { Input, Switch } from '../../components/ui/field';
import { EmptyState, Skeleton } from '../../components/ui/panel';
import { useToast } from '../../components/ui/toast';
import { useConfirm } from '../../components/ui/confirm';

const toDraft = (stage: RoadmapStage): RoadmapStageDraft => ({
  title: stage.title,
  lessonsCount: stage.lessonsCount,
  hasTest: stage.hasTest,
  summary: stage.summary ?? '',
  modules: stage.modules ?? [],
  imageUrl: stage.imageUrl ?? '',
  active: stage.active,
});

export default function RoadmapPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [stages, setStages] = useState<RoadmapStage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.replace('/login');
        return;
      }
      const message = err instanceof ApiError ? err.message : 'Сталася помилка';
      setError(message);
      toast(message, 'error');
    },
    [router, toast],
  );

  const reload = useCallback(() => {
    fetchRoadmap().then(setStages).catch(handleError);
  }, [handleError]);

  useEffect(reload, [reload]);

  // Search matches themes too: with six stages the titles fit on one screen,
  // but the module lists are where you actually lose things.
  const visible = useMemo(() => {
    if (!stages) return null;
    const q = query.trim().toLowerCase();
    if (!q) return stages;
    return stages.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.summary?.toLowerCase().includes(q) ||
        s.modules.some((m) => m.toLowerCase().includes(q)),
    );
  }, [stages, query]);

  const run = async (id: string | null, action: () => Promise<unknown>, message?: string) => {
    setBusyId(id);
    try {
      await action();
      reload();
      if (message) toast(message);
    } catch (err) {
      handleError(err);
    } finally {
      setBusyId(null);
    }
  };

  const move = (index: number, delta: number) => {
    if (!stages) return;
    const target = index + delta;
    if (target < 0 || target >= stages.length) return;
    return run(stages[index]._id, () =>
      reorderStages([
        { id: stages[index]._id, order: stages[target].order },
        { id: stages[target]._id, order: stages[index].order },
      ]),
    );
  };

  const duplicate = (stage: RoadmapStage) =>
    run(
      stage._id,
      () => createStage({ ...toDraft(stage), title: `${stage.title} (копія)`, active: false }),
      'Етап скопійовано — копія прихована',
    );

  const remove = async (stage: RoadmapStage) => {
    const ok = await confirm(`Видалити етап «${stage.title}»? Дію не можна скасувати.`);
    if (!ok) return;
    run(stage._id, () => deleteStage(stage._id), 'Етап видалено');
  };

  const toggleActive = (stage: RoadmapStage, active: boolean) =>
    run(
      stage._id,
      () => updateStage(stage._id, { ...toDraft(stage), active }),
      active ? 'Етап показано на сайті' : 'Етап прихований',
    );

  const totalLessons = stages?.filter((s) => s.active).reduce((n, s) => n + s.lessonsCount, 0) ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-xl text-sm text-ink-muted">
          Етапи секції «Путь курса». Порожній список означає, що секції на лендінгу немає.
          {stages?.length ? ` Зараз активних: ${stages.filter((s) => s.active).length}, уроків: ${totalLessons}.` : ''}
        </p>
        <Button
          variant="primary"
          onClick={() => {
            setCreating(true);
            setEditingId(null);
          }}
        >
          Додати етап
        </Button>
      </div>

      {stages && stages.length > 3 && (
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Пошук за назвою або темою"
          className="mt-6 max-w-sm"
        />
      )}

      {error && <p className="mt-6 text-sm text-danger">{error}</p>}

      {!stages && !error && (
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {creating && (
        <div className="mt-8">
          <RoadmapStageEditor
            onSave={async (draft) => {
              await createStage(draft);
              setCreating(false);
              reload();
              toast('Етап створено');
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {stages && stages.length === 0 && !creating && (
        <EmptyState
          text="Етапів ще немає. Додайте перший — і секція зʼявиться на лендінгу."
          action={
            <Button variant="ghost" onClick={() => setCreating(true)}>
              Додати етап
            </Button>
          }
        />
      )}

      {visible && visible.length === 0 && stages && stages.length > 0 && (
        <EmptyState text="Нічого не знайдено за цим запитом." />
      )}

      {visible && visible.length > 0 && (
        <div className="mt-6 space-y-3">
          {visible.map((stage) =>
            editingId === stage._id ? (
              <RoadmapStageEditor
                key={stage._id}
                stage={stage}
                onSave={async (draft) => {
                  await updateStage(stage._id, draft);
                  setEditingId(null);
                  reload();
                  toast('Етап збережено');
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={stage._id}
                className={`panel flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl px-5 py-4 transition-opacity ${
                  busyId === stage._id ? 'opacity-50' : ''
                } ${stage.active ? '' : 'border-dashed'}`}
              >
                <span className="w-16 shrink-0 font-mono text-sm text-accent">
                  {String(stage.order).padStart(2, '0')}
                </span>

                <div className="min-w-[12rem] flex-1">
                  <p className="font-medium">{stage.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {stage.lessonsCount} уроків
                    {stage.hasTest ? ' · тестування' : ''}
                    {stage.modules.length ? ` · ${stage.modules.length} тем` : ' · тем немає'}
                    {stage.imageUrl ? '' : ' · без зображення'}
                  </p>
                </div>

                <Switch
                  checked={stage.active}
                  onChange={(v) => toggleActive(stage, v)}
                  label={stage.active ? 'На сайті' : 'Прихований'}
                />

                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => move(stages!.indexOf(stage), -1)}
                    disabled={stages!.indexOf(stage) === 0 || !!query}
                    aria-label="Вгору"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => move(stages!.indexOf(stage), 1)}
                    disabled={stages!.indexOf(stage) === stages!.length - 1 || !!query}
                    aria-label="Вниз"
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() => {
                      setEditingId(stage._id);
                      setCreating(false);
                    }}
                  >
                    Редагувати
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => duplicate(stage)}>
                    Копія
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => remove(stage)}>
                    Видалити
                  </Button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
