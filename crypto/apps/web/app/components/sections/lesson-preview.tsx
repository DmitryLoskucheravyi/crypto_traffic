'use client';

import Image from 'next/image';
import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { content } from '../../lib/content';
import { SiteContent } from '../../lib/api';
import { DURATION, EASE } from '../../lib/motion';

type Preview = NonNullable<SiteContent['lessonPreview']>;

export const LessonPreview = ({ preview }: { preview: Preview | null }) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (!preview) return null;

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-container px-6 md:px-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          {content.lessonPreview.eyebrow}
        </span>
        <h2 className="mt-4 max-w-2xl text-2xl font-semibold md:text-[1.75rem] md:leading-[1.2]">
          {preview.title}
        </h2>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="mt-6 rounded-lg border border-ink/15 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted transition-colors duration-quick hover:border-accent/40 hover:text-ink"
        >
          {open ? content.lessonPreview.closeCta : content.lessonPreview.openCta}
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
              {/* Rendered only while open: a collapsed block should not pull a
                  full-width image over the wire. */}
              <div className="mt-7 grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-start">
                <div className="relative overflow-hidden rounded-xl border border-ink/10">
                  <Image
                    src={preview.mediaUrl}
                    alt={preview.mediaAlt}
                    width={1600}
                    height={1000}
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="h-auto w-full object-cover"
                  />
                  {preview.isIllustrative && (
                    <span className="absolute bottom-3 right-3 rounded bg-bg/80 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted backdrop-blur-sm">
                      {content.lessonPreview.illustrativeBadge}
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-ink-muted">{preview.description}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
