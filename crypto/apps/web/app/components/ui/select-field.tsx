'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DURATION, EASE } from '../../lib/motion';

export type SelectOption = { value: string; label: string };

// Replaces <select>: the native dropdown list is drawn by the OS and cannot be
// themed, so on a dark terminal-styled page it arrives as a white system menu.
// This is the same contract — labelled, keyboard-driven, one value — rendered
// by us instead.
export const SelectField = ({
  options,
  value,
  onChange,
  labelId,
}: {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  labelId?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value),
    ),
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const commit = (index: number) => {
    onChange(options[index].value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        setActive((i) => (i + delta + options.length) % options.length);
        return;
      }
      case 'Home':
        if (open) {
          event.preventDefault();
          setActive(0);
        }
        return;
      case 'End':
        if (open) {
          event.preventDefault();
          setActive(options.length - 1);
        }
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open) commit(active);
        else setOpen(true);
        return;
      case 'Escape':
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        return;
      case 'Tab':
        setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        onClick={() => {
          setActive(
            Math.max(
              0,
              options.findIndex((o) => o.value === value),
            ),
          );
          setOpen((v) => !v);
        }}
        onKeyDown={onKeyDown}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-ink/15 bg-bg px-4 py-3 text-left transition-colors duration-quick hover:border-ink/25 aria-expanded:border-accent/50"
      >
        <span>{selected?.label}</span>
        <span
          aria-hidden="true"
          className={`h-2 w-2 shrink-0 border-b border-r border-ink-muted transition-transform duration-quick ${
            open ? '-translate-y-0.5 rotate-[225deg]' : 'rotate-45'
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            tabIndex={-1}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: DURATION.quick, ease: EASE }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-lg border border-ink/15 bg-surface shadow-[0_24px_60px_-24px_hsl(var(--bg))]"
          >
            {options.map((option, i) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => commit(i)}
                  className={`cursor-pointer px-4 py-2.5 text-sm transition-colors duration-quick ${
                    i === active ? 'bg-accent/10 text-ink' : 'text-ink-muted'
                  } ${isSelected ? 'text-accent' : ''}`}
                >
                  {option.label}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
