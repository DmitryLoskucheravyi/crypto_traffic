'use client';

import { motion } from 'framer-motion';
import { content } from '../../lib/content';
import { CtaArrow } from '../icons';
import { HeroMarketBackdrop } from '../effects/hero-market-backdrop';
import { fadeUp, fadeUpStagger } from '../../lib/motion';

export const Hero = ({ botUsername }: { botUsername: string }) => (
  <section className="relative min-h-[100dvh] overflow-hidden">
    <HeroMarketBackdrop />

    <div className="relative max-w-container mx-auto px-6 md:px-8">
      <nav className="flex items-center gap-2.5 pt-8">
        <img src="/logo-mark.png" alt="" width={28} height={28} className="rounded-full" />
        <span className="font-mono text-sm tracking-wide text-ink-muted">крипто курсы</span>
      </nav>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUpStagger()}
        className="max-w-2xl pt-24 pb-32 md:pt-32 md:pb-40 min-h-[70vh] flex flex-col justify-center"
      >
        <motion.span
          variants={fadeUp}
          className="font-mono text-xs uppercase tracking-[0.2em] text-accent"
        >
          {content.hero.eyebrow}
        </motion.span>

        <motion.h1
          variants={fadeUp}
          className="mt-6 font-display text-[2.6rem] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-gradient-accent md:text-6xl lg:text-[4.25rem]"
        >
          {content.hero.h1}
        </motion.h1>

        <motion.p variants={fadeUp} className="mt-6 text-lg md:text-xl text-ink-muted max-w-xl">
          {content.hero.sub}
        </motion.p>

        {botUsername && (
          <motion.a
            variants={fadeUp}
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 mt-10 px-6 py-4 rounded-md bg-accent text-bg font-medium transition-colors duration-standard ease-premium hover:bg-ink w-fit"
          >
            {content.hero.cta}
            <CtaArrow
              size={18}
              className="transition-transform duration-standard ease-premium group-hover:translate-x-1"
            />
          </motion.a>
        )}
      </motion.div>
    </div>
  </section>
);
