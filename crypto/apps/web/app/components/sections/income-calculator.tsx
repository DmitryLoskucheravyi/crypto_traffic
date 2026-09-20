'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { content } from '../../lib/content';
import { Course, SiteContent } from '../../lib/api';
import { fadeUp } from '../../lib/motion';
import { CountUp } from '../ui/count-up';

type Calculator = NonNullable<SiteContent['calculator']>;

const money = (value: number, currency: string) =>
  `${new Intl.NumberFormat('ru-RU').format(Math.round(value))} ${currency}`;

export const IncomeCalculator = ({
  calculator,
  courses,
}: {
  calculator: Calculator | null;
  courses: Course[];
}) => {
  // Tiers the owner configured, narrowed to courses that are actually on sale.
  const tiers = useMemo(() => {
    if (!calculator) return [];
    return calculator.tiers.filter((t) => courses.some((c) => c.tier === t.tier));
  }, [calculator, courses]);

  const [amount, setAmount] = useState(() =>
    calculator ? Math.round((calculator.amountMin + calculator.amountMax) / 2) : 0,
  );
  const [tier, setTier] = useState(() => tiers[0]?.tier ?? '');

  const selected = tiers.find((t) => t.tier === tier) ?? tiers[0];

  const range = useMemo(() => {
    if (!selected) return null;
    return {
      low: amount * (1 + selected.lowPct / 100),
      high: amount * (1 + selected.highPct / 100),
    };
  }, [amount, selected]);

  // Switched off, unconfigured, or no matching active course — no section.
  if (!calculator || !selected || !range) return null;

  const courseTitle = (value: string) => courses.find((c) => c.tier === value)?.title ?? value;

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-container px-6 md:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
        >
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            {content.calculator.eyebrow}
          </span>
          <h2 className="mt-4 max-w-2xl text-2xl font-semibold md:text-[2.25rem] md:leading-[1.1]">
            {content.calculator.title}
          </h2>
          <p className="mt-3 max-w-xl text-ink-muted">{content.calculator.sub}</p>
        </motion.div>

        <div className="mt-12 grid gap-8 rounded-2xl border border-ink/10 bg-surface/60 p-6 md:grid-cols-2 md:gap-12 md:p-10">
          <div>
            <label htmlFor="calc-amount" className="block text-sm text-ink-muted">
              {content.calculator.amountLabel}
            </label>
            <output
              htmlFor="calc-amount"
              className="mt-2 block font-mono text-3xl tabular-nums md:text-4xl"
            >
              {money(amount, calculator.currency)}
            </output>
            <input
              id="calc-amount"
              type="range"
              min={calculator.amountMin}
              max={calculator.amountMax}
              step={calculator.amountStep}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="calc-range mt-5 w-full"
            />
            <div className="mt-2 flex justify-between font-mono text-[11px] text-ink-muted">
              <span>{money(calculator.amountMin, calculator.currency)}</span>
              <span>{money(calculator.amountMax, calculator.currency)}</span>
            </div>

            <label htmlFor="calc-tier" className="mt-8 block text-sm text-ink-muted">
              {content.calculator.tierLabel}
            </label>
            <select
              id="calc-tier"
              value={selected.tier}
              onChange={(e) => setTier(e.target.value)}
              className="mt-2 w-full rounded-lg border border-ink/15 bg-bg px-4 py-3 outline-none transition-colors duration-quick focus:border-accent"
            >
              {tiers.map((t) => (
                <option key={t.tier} value={t.tier}>
                  {courseTitle(t.tier)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-center border-t border-ink/10 pt-8 md:border-l md:border-t-0 md:pl-12 md:pt-0">
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-ink-muted">
              {content.calculator.resultLabel} {calculator.horizonMonths}{' '}
              {content.calculator.monthsLabel}
            </span>

            <p className="mt-4 font-display text-3xl font-semibold tabular-nums text-accent md:text-[2.5rem] md:leading-tight">
              <CountUp
                key={`${selected.tier}-low`}
                value={Math.round(range.low)}
                format={(v) => new Intl.NumberFormat('ru-RU').format(v)}
              />
              {' — '}
              <CountUp
                key={`${selected.tier}-high`}
                value={Math.round(range.high)}
                format={(v) => new Intl.NumberFormat('ru-RU').format(v)}
              />{' '}
              <span className="text-2xl md:text-3xl">{calculator.currency}</span>
            </p>

            <p className="mt-5 text-xs leading-relaxed text-ink-muted">{calculator.disclaimer}</p>

            <a
              href="#courses"
              className="mt-7 inline-flex w-fit items-center rounded-lg border border-ink/15 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted transition-colors duration-quick hover:border-accent/40 hover:text-ink"
            >
              {content.calculator.cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
