'use client';

import Image from 'next/image';
import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { content } from '../../lib/content';
import { RoadmapStage } from '../../lib/api';
import { DURATION, EASE } from '../../lib/motion';

// «5 уроков» / «1 урок» / «2 урока» — three forms, no i18n library for one word.
function lessonsLabel(count: number): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${count} уроков`;
  if (mod10 === 1) return `${count} урок`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} урока`;
  return `${count} уроков`;
}

// The panel lands first and its contents follow one behind the other. The
// parent variant drives the whole cascade, so a card is one timeline instead
// of six hand-tuned delays.
const panel = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.standard, ease: EASE, staggerChildren: 0.05 },
  },
};

const line = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.standard, ease: EASE } },
};

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
    <span className="h-1.5 w-1.5 shrink-0 bg-accent" />
    {children}
  </span>
);

export const RoadmapCard = ({ stage }: { stage: RoadmapStage }) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const hasModules = stage.modules.length > 0;

  return (
    <motion.div
      variants={panel}
      className="group relative rounded-xl border border-ink/10 bg-surface/95 p-6 backdrop-blur-md transition-colors duration-standard ease-premium hover:border-accent/30"
    >
      {stage.imageUrl && (
        // Deliberately static: no entrance, no reaction to the card opening.
        // A plain div rather than a motion one — inside the card's variant
        // cascade a motion child without its own variants inherits the
        // parent's "hidden" state and never comes back. z-10 keeps it above
        // the transformed siblings below it.
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 -top-6 z-10 h-24 w-24 select-none"
        >
          <Image
            src={stage.imageUrl}
            alt=""
            width={96}
            height={96}
            className="h-24 w-24 object-contain"
          />
        </div>
      )}

      <motion.span
        variants={line}
        className="block font-mono text-xs uppercase tracking-[0.2em] text-ink-muted"
      >
        {content.roadmap.stageLabel} {stage.order}
      </motion.span>

      <motion.h3
        variants={line}
        className="mt-3 max-w-[85%] font-display text-lg font-semibold uppercase leading-tight md:text-xl"
      >
        {stage.title}
      </motion.h3>

      {stage.summary && (
        <motion.p variants={line} className="mt-2 text-sm leading-relaxed text-ink-muted">
          {stage.summary}
        </motion.p>
      )}

      <motion.div variants={line} className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Chip>{lessonsLabel(stage.lessonsCount)}</Chip>
        {stage.hasTest && <Chip>{content.roadmap.testChip}</Chip>}
      </motion.div>

      {hasModules && (
        <motion.div variants={line}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            className="mt-5 w-full rounded-lg border border-ink/15 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted transition-colors duration-quick ease-premium hover:border-accent/40 hover:text-ink"
          >
            {content.roadmap.structureCta}
          </button>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                id={panelId}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: DURATION.standard, ease: EASE }}
                className="overflow-hidden"
              >
                <ol className="mt-4 space-y-2 border-t border-ink/10 pt-4">
                  {stage.modules.map((module, i) => (
                    <li key={`${module}-${i}`} className="flex gap-3 text-sm text-ink-muted">
                      <span className="font-mono text-xs tabular-nums text-accent/60">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span>{module}</span>
                    </li>
                  ))}
                </ol>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};
