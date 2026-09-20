'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { content } from '../../lib/content';
import { LogoMark, CtaArrow } from '../icons';
import { HeroBackdrop } from '../effects/hero-backdrop';
import { fadeUp, fadeUpStagger } from '../../lib/motion';

export const Hero = ({ botUsername }: { botUsername: string }) => (
  <section className="relative min-h-[100dvh] overflow-hidden">
    <HeroBackdrop />

    <div className="relative max-w-container mx-auto px-6 md:px-8">
      <nav className="flex items-center gap-2 pt-8">
        <LogoMark size={22} className="text-accent" />
        <span className="font-mono text-sm tracking-wide text-ink-muted">крипто курси</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-10 pt-16 pb-24 md:pt-24 md:pb-32">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUpStagger()}
          className="md:col-span-7"
        >
          <motion.span
            variants={fadeUp}
            className="font-mono text-xs uppercase tracking-[0.2em] text-accent"
          >
            {content.hero.eyebrow}
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="mt-6 text-4xl md:text-6xl lg:text-[4.5rem] leading-[1.05] font-semibold text-gradient-gold"
          >
            {content.hero.h1}
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 text-lg text-ink-muted max-w-xl">
            {content.hero.sub}
          </motion.p>

          {botUsername && (
            <motion.a
              variants={fadeUp}
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 mt-10 px-6 py-4 rounded-md bg-accent text-bg font-medium transition-colors duration-standard ease-premium hover:bg-ink"
            >
              {content.hero.cta}
              <CtaArrow
                size={18}
                className="transition-transform duration-standard ease-premium group-hover:translate-x-1"
              />
            </motion.a>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
          className="md:col-span-5 relative aspect-[4/3]"
        >
          <Image
            src="/hero.jpg"
            alt="Абстрактна композиція зі скляних граней, підсвічених теплим золотим світлом"
            fill
            priority
            sizes="(max-width: 768px) 90vw, 40vw"
            className="object-contain"
          />
        </motion.div>
      </div>
    </div>
  </section>
);
