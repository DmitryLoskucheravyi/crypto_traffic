'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { content } from '../../lib/content';
import { CtaArrow, TelegramMark } from '../icons';
import { fadeUp } from '../../lib/motion';

export const FinalCta = ({ botUsername }: { botUsername: string }) => (
  <section className="py-24 md:py-32">
    <div className="max-w-container mx-auto px-6 md:px-8">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUp}
        className="relative rounded-2xl overflow-hidden border border-ink/10"
      >
        <Image
          src="/final-cta.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-bg/80" />

        <div className="relative p-12 md:p-16 flex flex-col items-center text-center">
          <TelegramMark size={32} className="text-accent" />
          <h2 className="mt-6 text-3xl md:text-4xl font-semibold">{content.finalCta.title}</h2>
          <p className="mt-3 text-ink-muted max-w-md">{content.finalCta.sub}</p>
          {botUsername && (
            <a
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 mt-8 px-6 py-4 rounded-md bg-accent text-bg font-medium transition-colors duration-standard ease-premium hover:bg-ink"
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
