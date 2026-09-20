'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type Tone = 'ok' | 'error';
type Toast = { id: number; text: string; tone: Tone };

const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => {});

// Saving used to leave a quiet "Збережено" next to each button, which is easy
// to miss and impossible to see when the form is scrolled away. One stack in
// the corner reports every result the same way.
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string, tone: Tone = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, text, tone }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3500);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-72 flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`panel-raised animate-toast-in rounded-lg px-4 py-3 text-sm shadow-[0_20px_50px_-20px_hsl(var(--bg))] ${
              toast.tone === 'error' ? 'text-danger' : 'text-ink'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  toast.tone === 'error' ? 'bg-danger' : 'bg-accent'
                }`}
              />
              {toast.text}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
