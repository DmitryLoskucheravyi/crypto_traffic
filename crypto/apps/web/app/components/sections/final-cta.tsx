'use client';

import { motion } from 'framer-motion';
import { content } from '../../lib/content';
import { CtaArrow, TelegramMark } from '../icons';
import { CandleTexture } from '../effects/candle-texture';
import { fadeUp } from '../../lib/motion';

export const FinalCta = ({ botUsername }: { botUsername: string }) => (
  <section className="py-24 md:py-32">
    <div className="mx-auto max-w-container px-6 md:px-8">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUp}
        className="relative overflow-hidden rounded-2xl border border-ink/10 bg-surface"
      >
        {/* The page opened on this tape; it closes on it, turned down far enough
            to be texture. */}
        <CandleTexture className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.09]" />

        {/* The glow breathes instead of sitting still — same panel, no extra
            elements. The reduced-motion block in globals.css stops it. */}
        <div
          className="absolute inset-0 animate-breathe"
          style={{
            background:
              'radial-gradient(60% 80% at 50% 100%, hsl(var(--accent) / 0.22), transparent 70%), radial-gradient(40% 50% at 15% 0%, hsl(var(--accent) / 0.12), transparent 70%)',
          }}
        />

        <div className="relative flex flex-col items-center p-12 text-center md:p-16">
          <TelegramMark size={32} className="text-accent" />
          {/* The one step back UP the ladder — it is the closing ask, so it
              outranks every heading below the bento. */}
          <h2 className="mt-6 text-[1.75rem] font-semibold md:text-[2.25rem] md:leading-[1.1]">
            {content.finalCta.title}
          </h2>
          <p className="mt-3 max-w-md text-ink-muted">{content.finalCta.sub}</p>
          {botUsername && (
            <a
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 inline-flex items-center gap-3 rounded-md bg-accent px-6 py-4 font-medium text-bg transition-colors duration-standard ease-premium hover:bg-ink"
            >
              {content.finalCta.cta}
              <CtaArrow
                size={18}
                className="transition-transform duration-standard ease-premium group-hover:translate-x-1"
              />
            </a>
          )}
        </div>
      </motion.div>
    </div>
  </section>
);
