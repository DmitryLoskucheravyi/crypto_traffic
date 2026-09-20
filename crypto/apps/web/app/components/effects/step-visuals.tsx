'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { DURATION, EASE } from '../../lib/motion';

// The three "how it works" cards each get a small demo of the step they
// describe instead of a lone line icon in a half-empty panel. They play once,
// when their card arrives in the middle of the viewport — the same trigger the
// rest of the page uses for its reveals — and hold their end state afterwards.

const useStepPlay = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-25% 0px -25% 0px' });
  const reduce = useReducedMotion();
  // Reduced motion still gets the finished picture, just without the build.
  return { ref, play: inView, reduce: Boolean(reduce) };
};

// One frame around all three so they read as three views of the same terminal
// rather than three unrelated widgets.
const Frame = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="relative overflow-hidden rounded-xl border border-ink/10 bg-bg/40 p-5 md:p-6">
    <div className="flex items-center gap-1.5 pb-4">
      <span className="h-1.5 w-1.5 rounded-full bg-ink/20" />
      <span className="h-1.5 w-1.5 rounded-full bg-ink/20" />
      <span className="h-1.5 w-1.5 rounded-full bg-ink/20" />
      <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </span>
    </div>
    {children}
  </div>
);

const MENU = ['Базовый', 'Средний', 'Продвинутый'];

// Step 1 — the cursor travels to /start, clicks, the menu drops in and each
// level lights up in turn before settling on the middle one.
export const SelectDemo = () => {
  const { ref, play, reduce } = useStepPlay();
  const [highlight, setHighlight] = useState(-1);

  useEffect(() => {
    if (!play) return;
    if (reduce) {
      setHighlight(1);
      return;
    }
    const order = [...MENU.map((_, i) => i), 1];
    const timers = order.map((value, i) =>
      window.setTimeout(() => setHighlight(value), 1500 + i * 520),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [play, reduce]);

  const show = (delay: number) =>
    play ? { opacity: 1, y: 0, transition: { duration: DURATION.standard, ease: EASE, delay } } : {};

  return (
    <div ref={ref}>
      <Frame label="telegram">
        <div className="flex justify-end">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={show(0)}
            className="rounded-lg rounded-br-sm bg-accent/15 px-3 py-1.5 font-mono text-xs text-accent"
          >
            /start
          </motion.span>
        </div>

        {/* Anchored to the bubble rather than to the frame, so the cursor lands
            on it at any card width. */}
        <div className="pointer-events-none absolute right-6 top-14 md:right-7 md:top-16">
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 26, y: 30 }}
            animate={play ? { opacity: [0, 1, 1], x: [26, 0, 0], y: [30, 0, 0] } : {}}
            transition={{ duration: 0.85, times: [0, 0.75, 1], ease: EASE }}
          >
            <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true">
              <path
                d="M1 1l12.5 7.2-5.6 1.1-2.4 5.4z"
                fill="hsl(var(--ink))"
                stroke="hsl(var(--bg))"
                strokeWidth="1"
              />
            </svg>
            <motion.span
              className="absolute -left-2 -top-2 block h-7 w-7 rounded-full border border-accent"
              initial={{ opacity: 0, scale: 0.3 }}
              animate={play && !reduce ? { opacity: [0, 0.7, 0], scale: [0.3, 1.5, 1.8] } : {}}
              transition={{ duration: 0.7, delay: 0.8, ease: EASE }}
            />
          </motion.div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {MENU.map((label, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={show(1.1 + i * 0.12)}
              className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors duration-standard ease-premium ${
                highlight === i
                  ? 'border-accent/60 bg-accent/10 text-ink'
                  : 'border-ink/10 text-ink-muted'
              }`}
            >
              <span>{label}</span>
              <span className="font-mono text-[10px] tabular-nums text-ink-muted">0{i + 1}</span>
            </motion.div>
          ))}
        </div>
      </Frame>
    </div>
  );
};

// Step 2 — the bot's answer types itself out, character by character, in the
// terminal's own monospace. `price` is the real figure for the entry tier when
// the API returned one; there is no invented number to fall back on, so without
// it the demo types the honest line instead.
export const PriceDemo = ({ title, price }: { title?: string; price?: string }) => {
  const { ref, play, reduce } = useStepPlay();
  const line = price ? `цена: ${price}` : 'цена: актуальная в боте';
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (!play) return;
    if (reduce) {
      setTyped(line.length);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(i);
      if (i >= line.length) window.clearInterval(id);
    }, 55);
    return () => window.clearInterval(id);
  }, [play, reduce, line]);

  const done = typed >= line.length;

  return (
    <div ref={ref}>
      <Frame label="ответ бота">
        <div className="flex flex-col gap-3 font-mono text-xs">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={
              play ? { opacity: 1, y: 0, transition: { duration: DURATION.standard, ease: EASE } } : {}
            }
            className="text-ink-muted"
          >
            <span className="text-accent">&gt;</span> курс: {title ?? 'базовый'}
          </motion.div>

          <div className="text-xl text-ink md:text-2xl">
            <span className="tabular-nums">{line.slice(0, typed)}</span>
            <span
              className={`ml-0.5 inline-block h-[1em] w-[0.5em] translate-y-[0.12em] bg-accent ${
                done ? 'animate-caret' : ''
              }`}
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={done ? { opacity: 1, transition: { duration: DURATION.standard, ease: EASE } } : {}}
            className="text-[11px] text-ink-muted"
          >
            без скрытых условий
          </motion.div>
        </div>
      </Frame>
    </div>
  );
};

const FILES = ['модуль 01', 'модуль 02', 'модуль 03'];

// Step 3 — the lock opens and the materials slide out from under it.
export const AccessDemo = () => {
  const { ref, play, reduce } = useStepPlay();

  return (
    <div ref={ref}>
      <Frame label="доступ">
        <div className="flex items-center gap-5">
          <svg
            width="46"
            height="52"
            viewBox="0 0 46 52"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            {/* The shackle lifts and swings out of the body; the body stays put. */}
            <motion.path
              d="M14 22v-7a9 9 0 0 1 18 0v7"
              stroke="hsl(var(--accent))"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ transformOrigin: '32px 22px' }}
              initial={{ rotate: 0, y: 0 }}
              animate={play ? { rotate: reduce ? -28 : [0, -4, -28], y: reduce ? -3 : [0, 1, -3] } : {}}
              transition={{ duration: 0.9, delay: 0.25, times: [0, 0.35, 1], ease: EASE }}
            />
            <rect
              x="8"
              y="22"
              width="30"
              height="24"
              rx="5"
              fill="hsl(var(--accent) / 0.16)"
              stroke="hsl(var(--accent))"
              strokeWidth="2"
            />
            <motion.circle
              cx="23"
              cy="34"
              r="3"
              fill="hsl(var(--accent))"
              initial={{ opacity: 0.35 }}
              animate={play ? { opacity: 1 } : {}}
              transition={{ duration: DURATION.standard, delay: 1, ease: EASE }}
            />
          </svg>

          <div className="flex flex-1 flex-col gap-2">
            {FILES.map((file, i) => (
              <motion.div
                key={file}
                initial={{ opacity: 0, x: -28, scale: 0.96 }}
                animate={
                  play
                    ? {
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        transition: { duration: DURATION.slow, ease: EASE, delay: 1 + i * 0.13 },
                      }
                    : {}
                }
                className="flex items-center gap-3 rounded-md border border-ink/10 bg-surface/60 px-3 py-2"
              >
                <span className="h-6 w-4 shrink-0 rounded-sm border border-accent/40 bg-accent/10" />
                <span className="flex-1">
                  <span className="block h-1.5 w-full rounded-full bg-ink/15" />
                  <span className="mt-1.5 block h-1.5 w-2/3 rounded-full bg-ink/10" />
                </span>
                <span className="font-mono text-[10px] text-ink-muted">{file}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </Frame>
    </div>
  );
};
