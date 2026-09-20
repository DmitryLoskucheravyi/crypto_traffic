'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { content } from '../../lib/content';
import { StepSelect, StepPrice, StepAccess } from '../icons';
import { fadeUp, fadeUpStagger } from '../../lib/motion';

const ICONS = { select: StepSelect, price: StepPrice, access: StepAccess };

export const HowItWorks = () => (
  <section className="py-24 md:py-32">
    <div className="max-w-container mx-auto px-6 md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-start">
        <div className="md:col-span-7">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            className="text-2xl md:text-3xl font-semibold"
          >
            {content.howItWorks.title}
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUpStagger(0.1)}
            className="mt-10 flex flex-col gap-4"
          >
            {content.howItWorks.steps.map((step, i) => {
              const Icon = ICONS[step.icon];
              return (
                <motion.div
                  key={step.title}
                  variants={fadeUp}
                  className="glass-panel rounded-lg p-6 flex items-start gap-5"
                >
                  <span className="font-mono text-xs text-ink-muted pt-1">0{i + 1}</span>
                  <Icon size={26} className="text-accent shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-medium">{step.title}</h3>
                    <p className="mt-1 text-ink-muted text-sm leading-relaxed">{step.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="md:col-span-5 relative aspect-[3/4] rounded-lg overflow-hidden"
        >
          <Image
            src="/how-it-works.jpg"
            alt="Похила скляна панель із золотим променем світла"
            fill
            sizes="(max-width: 768px) 90vw, 35vw"
            className="object-cover"
          />
        </motion.div>
      </div>
    </div>
  </section>
);
