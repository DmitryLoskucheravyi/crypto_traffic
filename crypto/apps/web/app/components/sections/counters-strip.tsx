'use client';

import { content } from '../../lib/content';
import { counters } from '../../lib/site-data';
import { CountUp } from '../ui/count-up';

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(iso),
  );

// Fixed numbers with the date they were last confirmed. No live feed and no
// drifting counter: the date is what makes a static number honest.
export const CountersStrip = () => {
  return (
    <section className="border-y border-ink/10 py-10">
      <div className="mx-auto flex max-w-container flex-col gap-6 px-5 sm:px-6 md:flex-row md:items-end md:justify-between md:px-8">
        <div className="flex flex-wrap gap-8 sm:gap-10">
          {counters.studentsTotal !== null && (
            <div>
              <p className="font-display text-3xl font-semibold tabular-nums text-accent md:text-4xl">
                <CountUp
                  value={counters.studentsTotal}
                  format={(v) => new Intl.NumberFormat('ru-RU').format(v)}
                />
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
                {content.counters.studentsLabel}
              </p>
            </div>
          )}

          {counters.seatsLeft !== null && (
            <div>
              <p className="font-display text-3xl font-semibold tabular-nums md:text-4xl">
                <CountUp value={counters.seatsLeft} />
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
                {counters.note || content.counters.seatsLabel}
              </p>
            </div>
          )}
        </div>

        {counters.updatedAt && (
          <p className="font-mono text-[11px] text-ink-muted">
            {content.counters.updatedPrefix} {formatDate(counters.updatedAt)}
          </p>
        )}
      </div>
    </section>
  );
};
