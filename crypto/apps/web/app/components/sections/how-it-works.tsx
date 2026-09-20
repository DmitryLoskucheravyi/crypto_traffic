'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import type { Course } from '../../lib/api';
import { content } from '../../lib/content';
import { StepSelect, StepPrice, StepAccess } from '../icons';
import { SelectDemo, PriceDemo, AccessDemo } from '../effects/step-visuals';
import { fadeUp } from '../../lib/motion';

const ICONS = { select: StepSelect, price: StepPrice, access: StepAccess };
const steps = content.howItWorks.steps;

// Each card sticks a bit lower than the one before it, so the previous card's
// header strip stays visible as the next slides up from below and piles on top.
const TOP_BASE = 88; // px — where the first card parks
const PEEK = 84; // px — visible strip of each already-parked card

const pad = (n: number) => String(n).padStart(2, '0');

// The rail lives in the gutter left of the stack, which is why the cards get
// extra left padding from lg up. Its dot for step i sits at the middle of that
// step's share of the scroll range.
const dotAt = (i: number) => ((i + 0.5) / steps.length) * 100;

const Rail = ({ progress }: { progress: ReturnType<typeof useScroll>['scrollYProgress'] }) => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 hidden lg:block"
  >
    <div className="mx-auto h-full max-w-container px-6 md:px-8">
      {/* Sticky, not full-height: the stack is several viewports tall, so a rail
          spanning all of it would put the filling edge off screen most of the
          time. This one parks beside the cards and fills where it can be seen. */}
      <div className="sticky top-32 h-[52vh] w-px bg-ink/10">
        {/* Same idea as the bento progress segments above: one accent line
            filling as the section is consumed. */}
        <motion.div
          className="h-full w-px origin-top bg-accent"
          style={{ scaleY: progress }}
        />
        {steps.map((step, i) => (
          <RailDot key={step.title} progress={progress} at={dotAt(i)} index={i} />
        ))}
      </div>
    </div>
  </div>
);

const RailDot = ({
  progress,
  at,
  index,
}: {
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
  at: number;
  index: number;
}) => {
  const fraction = at / 100;
  const opacity = useTransform(progress, [fraction - 0.06, fraction], [0.25, 1]);
  const scale = useTransform(progress, [fraction - 0.06, fraction], [0.7, 1]);

  return (
    <motion.span
      className="absolute -left-[3px] flex h-[7px] w-[7px] items-center justify-center rounded-full bg-accent"
      style={{ top: `${at}%`, opacity, scale }}
    >
      <span className="absolute -left-8 font-mono text-[10px] tabular-nums text-ink-muted">
        {pad(index + 1)}
      </span>
    </motion.span>
  );
};

export const HowItWorks = ({ courses = [] }: { courses?: Course[] }) => {
  const stackRef = useRef<HTMLDivElement>(null);
  // The fill tracks the stack itself, so it completes exactly as the last card
  // releases rather than at some guessed scroll distance.
  const { scrollYProgress } = useScroll({
    target: stackRef,
    offset: ['start center', 'end end'],
  });

  const entry = courses.find((c) => c.tier === 'basic') ?? courses[0];
  const demos = [
    <SelectDemo key="select" />,
    <PriceDemo
      key="price"
      title={entry?.title}
      price={entry ? `${entry.price} ${entry.currency}` : undefined}
    />,
    <AccessDemo key="access" />,
  ];

  return (
    <section className="relative pt-24 md:pt-32">
      <div className="mx-auto max-w-container px-6 md:px-8">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="text-2xl font-semibold md:text-[2.25rem] md:leading-[1.1]"
        >
          {content.howItWorks.title}
        </motion.h2>
      </div>

      <div ref={stackRef} className="relative mt-14">
        <Rail progress={scrollYProgress} />

        {steps.map((step, i) => {
          const Icon = ICONS[step.icon];
          return (
            <div
              key={step.title}
              className="sticky pb-5"
              style={{ top: `${TOP_BASE + i * PEEK}px`, zIndex: i + 1 }}
            >
              <div className="mx-auto max-w-container px-6 md:px-8 lg:pl-20">
                {/* Light base under the glass — just enough to keep text legible
                    over the card below, the blur does the rest. */}
                <div className="rounded-2xl bg-bg/35 shadow-[0_24px_70px_-28px_hsl(var(--bg))]">
                  <div
                    className="glass-panel relative flex min-h-[44vh] flex-col overflow-hidden rounded-2xl px-8 py-9 md:px-12 md:py-11"
                    style={{
                      background:
                        'linear-gradient(180deg, hsl(var(--surface) / 0.35), hsl(var(--surface) / 0.15))',
                    }}
                  >
                    {/* Outlined numeral behind the header — scale without extra
                        content, and it is what the rail's dots count off. */}
                    <span
                      aria-hidden="true"
                      className="step-watermark pointer-events-none absolute -top-4 left-4 select-none font-display text-[7rem] font-extrabold leading-none tabular-nums md:-top-6 md:left-8 md:text-[11rem]"
                    >
                      {pad(i + 1)}
                    </span>

                    <div className="relative grid flex-1 items-center gap-8 md:grid-cols-2 md:gap-12">
                      <div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs text-ink-muted">#</span>
                          <Icon size={22} className="shrink-0 text-accent" />
                          <h3 className="text-xl font-medium md:text-2xl">{step.title}</h3>
                        </div>
                        <p className="mt-6 text-base leading-relaxed text-ink-muted md:text-lg">
                          {step.body}
                        </p>
                      </div>

                      {/* Phones only ever see one card at a time and the panel
                          is not empty there; adding the demo would push the
                          parked stack past the bottom of a short viewport. */}
                      <div className="hidden md:block">{demos[i]}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Inside the sticky container on purpose — this is what gives the LAST
            card a scroll range to stay parked in. Outside it, sticky releases
            the moment the container ends. */}
        <div className="h-[70vh]" />
      </div>
    </section>
  );
};
