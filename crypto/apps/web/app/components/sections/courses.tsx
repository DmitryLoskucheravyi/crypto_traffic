'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Course } from '../../lib/api';
import { content } from '../../lib/content';
import { TierCheck, CtaArrow } from '../icons';
import { fadeUp, fadeUpStagger } from '../../lib/motion';

const TIER_LABELS: Record<Course['tier'], string> = {
  basic: 'Базовий',
  medium: 'Середній',
  advanced: 'Просунутий',
};

const TIER_IMAGES: Record<Course['tier'], string> = {
  basic: '/tier-basic.jpg',
  medium: '/tier-medium.jpg',
  advanced: '/tier-advanced.jpg',
};

export const Courses = ({ courses, botUsername }: { courses: Course[]; botUsername: string }) => (
  <section className="py-24 md:py-32">
    <div className="max-w-container mx-auto px-6 md:px-8">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUp}
      >
        <h2 className="text-2xl md:text-3xl font-semibold">{content.courses.title}</h2>
        <p className="mt-3 text-ink-muted max-w-lg">{content.courses.sub}</p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUpStagger(0.1)}
        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {courses.map((course) => (
          <motion.div
            key={course.tier}
            variants={fadeUp}
            className="glass-panel rounded-lg overflow-hidden flex flex-col"
          >
            <div className="relative aspect-square bg-bg">
              <Image
                src={TIER_IMAGES[course.tier]}
                alt={`Скляна композиція, що символізує рівень «${TIER_LABELS[course.tier]}»`}
                fill
                sizes="(max-width: 768px) 90vw, 30vw"
                className="object-cover"
              />
            </div>

            <div className="p-8 flex flex-col flex-1">
              <div className="flex items-center gap-2 text-accent">
                <TierCheck size={18} />
                <span className="font-mono text-xs uppercase tracking-wide">
                  {TIER_LABELS[course.tier]}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-medium">{course.title}</h3>
              <p className="mt-3 text-ink-muted text-sm leading-relaxed flex-1">
                {course.description}
              </p>
              <div className="mt-6 font-mono text-3xl text-ink">
                {course.price}
                <span className="text-base text-ink-muted"> {course.currency}</span>
              </div>
              {botUsername && (
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md border border-accent/40 text-accent transition-colors duration-standard ease-premium hover:bg-accent hover:text-bg"
                >
                  Купити в Telegram
                  <CtaArrow
                    size={16}
                    className="transition-transform duration-standard ease-premium group-hover:translate-x-1"
                  />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);
