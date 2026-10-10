'use client';

import { motion } from 'framer-motion';
import { content } from '../../lib/content';
import { comparison } from '../../lib/site-data';
import { fadeUp } from '../../lib/motion';

// Terminal diff, but without red: --bear is reserved for chart visuals, so the
// weaker side is simply muted and the course side carries the accent.
export const Comparison = () => {
  return (
    <section
      id="comparison"
      aria-labelledby="comparison-title"
      className="scroll-mt-24 py-20 md:py-32"
    >
      <div className="mx-auto max-w-container px-5 sm:px-6 md:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
        >
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            {content.comparison.eyebrow}
          </span>
          <h2
            id="comparison-title"
            className="mt-4 max-w-2xl text-[1.6rem] font-semibold leading-tight sm:text-2xl md:text-[2rem] md:leading-[1.15]"
          >
            {content.comparison.title}
          </h2>
        </motion.div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-ink/10 md:mt-12">
          <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] border-b border-ink/10 bg-surface/95 md:grid">
            <span className="px-6 py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted" />
            <span className="px-6 py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
              {comparison.leftTitle}
            </span>
            <span className="px-6 py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
              {comparison.rightTitle}
            </span>
          </div>

          {comparison.rows.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1], delay: i * 0.04 }}
              className="grid grid-cols-1 gap-2 border-b border-ink/10 px-5 py-5 last:border-b-0 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] md:items-baseline md:gap-0 md:px-0 md:py-0"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted md:px-6 md:py-5">
                {row.label}
              </span>
              <span className="flex gap-2 font-mono text-sm text-ink-muted md:px-6 md:py-5">
                <span aria-hidden="true" className="select-none opacity-50">
                  -
                </span>
                {row.left}
              </span>
              <span className="flex gap-2 font-mono text-sm text-ink md:px-6 md:py-5">
                <span aria-hidden="true" className="select-none text-accent">
                  +
                </span>
                {row.right}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
