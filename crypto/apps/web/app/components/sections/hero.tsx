'use client';

import { motion } from 'framer-motion';
import { content } from '../../lib/content';
import { BOT_URL } from '../../lib/config';
import { CtaArrow } from '../icons';
import { HeroMarketBackdrop } from '../effects/hero-market-backdrop';
import { fadeUp, fadeUpStagger } from '../../lib/motion';
import { ScrambleText } from '../ui/scramble-text';
import { useMagnetic } from '../../lib/use-magnetic';

export const Hero = () => {
  const magnetic = useMagnetic<HTMLAnchorElement>();

  return (
    <section className="relative min-h-[100dvh] overflow-hidden">
      <HeroMarketBackdrop />

      <div className="relative max-w-container mx-auto px-5 sm:px-6 md:px-8">
        <nav className="flex items-center justify-between gap-3 pt-6 sm:gap-4 sm:pt-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <img src="/logo-mark.png" alt="" width={28} height={28} className="shrink-0" />
            <span className="truncate font-mono text-xs uppercase tracking-[0.18em] text-ink sm:text-sm">
              {content.brand}
            </span>
          </div>

          {/* Second entry point to the same bot the hero CTA opens: someone who
              already knows what they want should not have to scroll for it. */}
          <a
            href={BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[40px] shrink-0 items-center rounded-md border border-accent/40 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-accent transition-colors duration-standard ease-premium hover:bg-accent hover:text-bg sm:px-4"
          >
            {content.hero.navCta}
          </a>
        </nav>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUpStagger()}
          // Высоты подобраны так, чтобы на телефоне 667px весь экран — навигация,
          // заголовок и кнопка — помещался в первый экран без прокрутки.
          className="flex min-h-[62vh] max-w-2xl flex-col justify-center pb-20 pt-12 sm:min-h-[68vh] sm:pb-32 sm:pt-24 md:pb-40 md:pt-32"
        >
          <motion.span
            variants={fadeUp}
            className="font-mono text-xs uppercase tracking-[0.2em] text-accent"
          >
            {content.hero.eyebrow}
          </motion.span>

          {/* Балансируем размер под самый узкий экран: на 320px заголовок в
              4.25rem вылезал за колонку, поэтому мобильный шаг отдельный. */}
          <motion.h1
            variants={fadeUp}
            className="mt-6 font-display text-[2.05rem] font-extrabold uppercase leading-[1.02] tracking-[-0.02em] text-gradient-accent sm:text-[2.6rem] sm:leading-[0.95] sm:tracking-[-0.03em] md:text-6xl lg:text-[4.25rem]"
          >
            <ScrambleText text={content.hero.h1} />
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-xl text-base text-ink-muted sm:mt-6 sm:text-lg md:text-xl"
          >
            {content.hero.sub}
          </motion.p>

          <motion.a
            variants={fadeUp}
            ref={magnetic.ref}
            onPointerMove={magnetic.onPointerMove}
            onPointerLeave={magnetic.onPointerLeave}
            href={BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 inline-flex w-full items-center justify-center gap-3 rounded-md bg-accent px-6 py-4 font-medium text-bg transition-colors duration-standard ease-premium hover:bg-ink sm:mt-10 sm:w-fit"
          >
            {content.hero.cta}
            <CtaArrow
              size={18}
              className="transition-transform duration-standard ease-premium group-hover:translate-x-1"
            />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};
