'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { content } from '../../lib/content';
import { TogglePlus } from '../icons';
import { fadeUp, fadeUpStagger } from '../../lib/motion';

export const Faq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 py-20 md:py-32">
      <div className="mx-auto max-w-3xl px-5 sm:px-6 md:px-8">
        <motion.h2
          id="faq-title"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="text-xl font-semibold md:text-2xl"
        >
          {content.faq.title}
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUpStagger(0.06)}
          className="mt-10 flex flex-col gap-3"
        >
          {content.faq.items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div key={item.q} variants={fadeUp} className="glass-panel rounded-lg">
                {/* Заголовок снаружи, кнопка внутри: так вопрос попадает в структуру
                    страницы и в список заголовков скринридера, а не остаётся безымянным
                    текстом внутри контрола. */}
                <h3>
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="group flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                  >
                    <span id={`faq-question-${i}`} className="font-medium">
                      {item.q}
                    </span>
                    {/* Square terminal key rather than a stock chevron: the frame
                      holds still, the plus turns into a cross. */}
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-standard ease-premium ${
                        isOpen
                          ? 'border-accent/60 bg-accent/10 text-accent'
                          : 'border-ink/15 text-ink-muted group-hover:border-accent/40 group-hover:text-accent'
                      }`}
                    >
                      <TogglePlus
                        size={14}
                        className={`transition-transform duration-standard ease-premium ${
                          isOpen ? 'rotate-45' : ''
                        }`}
                      />
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-question-${i}`}
                  className="grid transition-[grid-template-rows] duration-standard ease-premium"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-ink-muted sm:px-6">
                      {item.a}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
