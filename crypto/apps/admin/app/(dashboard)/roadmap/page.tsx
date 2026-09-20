'use client';

import { useCallback, useEffect, useState } from 'react';
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

export default function RoadmapPage() {
  const router = useRouter();
  const [stages, setStages] = useState<RoadmapStage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.replace('/login');
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Не вдалося завантажити етапи');
    },
    [router],
  );

  const reload = useCallback(() => {
    fetchRoadmap().then(setStages).catch(handleError);
  }, [handleError]);

  useEffect(reload, [reload]);

  const onCreate = async (draft: RoadmapStageDraft) => {
    await createStage(draft);
    setCreating(false);
    reload();
  };

  const onUpdate = async (id: string, draft: RoadmapStageDraft) => {
    await updateStage(id, draft);
    setEditingId(null);
    reload();
  };

  const onDelete = async (stage: RoadmapStage) => {
    if (!confirm(`Видалити етап «${stage.title}»?`)) return;
    try {
      await deleteStage(stage._id);
      reload();
    } catch (err) {
      handleError(err);
    }
  };

  // Swap positions with the neighbour and let the server re-sequence.
  const move = async (index: number, delta: number) => {
    if (!stages) return;
    const target = index + delta;
    if (target < 0 || target >= stages.length) return;
    try {
      await reorderStages([
        { id: stages[index]._id, order: stages[target].order },
        { id: stages[target]._id, order: stages[index].order },
      ]);
      reload();
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Дорожня карта</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Етапи курсу — секція «Путь курса» на лендінгу. Порожній список означає, що секція
            не показується взагалі.
          </p>
        </div>
        <button
          onClick={() => {
            setCreating(true);
            setEditingId(null);
          }}
          className="shrink-0 rounded-md bg-accent text-bg font-medium px-5 py-2.5"
        >
          Додати етап
        </button>
      </div>

      {error && <p className="mt-6 text-danger">{error}</p>}

      {!stages && !error && <p className="mt-8 text-ink-muted">Завантаження...</p>}

      {creating && (
        <div className="mt-8">
          <RoadmapStageEditor onSave={onCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {stages && stages.length === 0 && !creating && (
        <p className="mt-8 text-ink-muted">Етапів ще немає.</p>
      )}

      {stages && stages.length > 0 && (
        <div className="mt-8 space-y-4">
          {stages.map((stage, index) =>
            editingId === stage._id ? (
              <RoadmapStageEditor
                key={stage._id}
                stage={stage}
                onSave={(draft) => onUpdate(stage._id, draft)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={stage._id} className="panel rounded-lg p-5 flex items-center gap-5">
                <span className="font-mono text-sm text-accent w-14 shrink-0">
                  Етап {stage.order}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {stage.title}
                    {!stage.active && (
                      <span className="ml-2 text-xs text-ink-muted">(прихований)</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {stage.lessonsCount} уроків
                    {stage.hasTest ? ' · тестування' : ''}
                    {stage.modules.length ? ` · ${stage.modules.length} тем` : ''}
                    {stage.imageUrl ? ` · ${stage.imageUrl}` : ' · без зображення'}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="px-2 py-1 text-ink-muted hover:text-ink disabled:opacity-30"
                    aria-label="Вгору"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === stages.length - 1}
                    className="px-2 py-1 text-ink-muted hover:text-ink disabled:opacity-30"
                    aria-label="Вниз"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(stage._id);
                      setCreating(false);
                    }}
                    className="ml-2 rounded-md border border-ink/15 px-3 py-1.5 text-sm hover:border-accent"
                  >
                    Редагувати
                  </button>
                  <button
                    onClick={() => onDelete(stage)}
                    className="rounded-md border border-ink/15 px-3 py-1.5 text-sm text-ink-muted hover:text-danger hover:border-danger/40"
                  >
                    Видалити
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
