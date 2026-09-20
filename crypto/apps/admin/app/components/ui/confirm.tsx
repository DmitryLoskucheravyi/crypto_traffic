'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Button } from './button';

type Request = { text: string; confirmLabel: string; resolve: (ok: boolean) => void };

const ConfirmContext = createContext<(text: string, confirmLabel?: string) => Promise<boolean>>(
  async () => false,
);

// window.confirm renders an OS dialog that ignores the theme and blocks the
// thread. This is the same yes/no contract, awaited the same way.
export const ConfirmProvider = ({ children }: { children: React.ReactNode }) => {
  const [request, setRequest] = useState<Request | null>(null);

  const ask = useCallback(
    (text: string, confirmLabel = 'Видалити') =>
      new Promise<boolean>((resolve) => setRequest({ text, confirmLabel, resolve })),
    [],
  );

  const close = (ok: boolean) => {
    request?.resolve(ok);
    setRequest(null);
  };

  useEffect(() => {
    if (!request) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {request && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 px-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) close(false);
          }}
        >
          <div className="panel-raised w-full max-w-sm rounded-xl p-6">
            <p className="text-sm leading-relaxed">{request.text}</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="quiet" size="sm" onClick={() => close(false)}>
                Скасувати
              </Button>
              <Button autoFocus variant="danger" size="sm" onClick={() => close(true)}>
                {request.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);
