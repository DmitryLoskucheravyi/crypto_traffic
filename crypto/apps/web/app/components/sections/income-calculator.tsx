'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { content } from '../../lib/content';
import { calculator, courses, type CourseTier } from '../../lib/site-data';
import { initialAmount, projectIncome, tierRates } from '../../lib/calculator';
import { formatMoney, formatNumber } from '../../lib/format';
import { fadeUp } from '../../lib/motion';
import { CountUp } from '../ui/count-up';
import { SelectField } from '../ui/select-field';

const tiers = calculator.tiers;

export const IncomeCalculator = () => {
  const [amount, setAmount] = useState(() => initialAmount(calculator));
  const [tier, setTier] = useState<CourseTier>(tiers[0].tier);

  const selected = tierRates(calculator, tier);
  const range = useMemo(() => projectIncome(amount, selected), [amount, selected]);

  const courseTitle = (value: CourseTier) => courses.find((c) => c.tier === value)?.title ?? value;

  return (
    <section
      id="calculator"
      aria-labelledby="calculator-title"
      className="scroll-mt-24 py-20 md:py-32"
    >
      <div className="mx-auto max-w-container px-5 sm:px-6 md:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
        >
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            {content.calculator.eyebrow}
          </span>
          <h2
            id="calculator-title"
            className="mt-4 max-w-2xl text-[1.6rem] font-semibold leading-tight sm:text-2xl md:text-[2.25rem] md:leading-[1.1]"
          >
            {content.calculator.title}
          </h2>
          <p className="mt-3 max-w-xl text-ink-muted">{content.calculator.sub}</p>
        </motion.div>

        <div className="mt-10 grid gap-8 rounded-2xl border border-ink/10 bg-surface/95 p-5 sm:p-6 md:mt-12 md:grid-cols-2 md:gap-12 md:p-10">
          <div>
            <label htmlFor="calc-amount" className="block text-sm text-ink-muted">
              {content.calculator.amountLabel}
            </label>
            <output
              htmlFor="calc-amount"
              className="mt-2 block font-mono text-2xl tabular-nums sm:text-3xl md:text-4xl"
            >
              {formatMoney(amount, calculator.currency)}
            </output>
            <input
              id="calc-amount"
              type="range"
              min={calculator.amountMin}
              max={calculator.amountMax}
              step={calculator.amountStep}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="calc-range mt-6 w-full"
            />
            <div className="mt-2 flex justify-between font-mono text-[11px] text-ink-muted">
              <span>{formatMoney(calculator.amountMin, calculator.currency)}</span>
              <span>{formatMoney(calculator.amountMax, calculator.currency)}</span>
            </div>

            <span id="calc-tier-label" className="mt-8 block text-sm text-ink-muted">
              {content.calculator.tierLabel}
            </span>
            <div className="mt-2">
              <SelectField
                labelId="calc-tier-label"
                value={selected.tier}
                onChange={(value) => setTier(value as CourseTier)}
                options={tiers.map((t) => ({ value: t.tier, label: courseTitle(t.tier) }))}
              />
            </div>
          </div>

          <div className="flex flex-col justify-center border-t border-ink/10 pt-8 md:border-l md:border-t-0 md:pl-12 md:pt-0">
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-ink-muted">
              {content.calculator.resultLabel} {calculator.horizonMonths}{' '}
              {content.calculator.monthsLabel}
            </span>

            <p className="mt-4 font-display text-[1.6rem] font-semibold leading-tight tabular-nums text-accent sm:text-3xl md:text-[2.5rem] md:leading-tight">
              <CountUp
                key={`${selected.tier}-low`}
                value={Math.round(range.low)}
                format={formatNumber}
              />
              {' — '}
              <CountUp
                key={`${selected.tier}-high`}
                value={Math.round(range.high)}
                format={formatNumber}
              />{' '}
              <span className="text-xl sm:text-2xl md:text-3xl">{calculator.currency}</span>
            </p>

            <p className="mt-5 text-xs leading-relaxed text-ink-muted">{calculator.disclaimer}</p>

            <a
              href="#courses"
              className="mt-7 inline-flex min-h-[44px] w-fit items-center rounded-lg border border-ink/15 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted transition-colors duration-quick hover:border-accent/40 hover:text-ink"
            >
              {content.calculator.cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
