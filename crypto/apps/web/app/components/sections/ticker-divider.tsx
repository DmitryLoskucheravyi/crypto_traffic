'use client';

import { useReducedMotion } from 'framer-motion';
import { SiteContent } from '../../lib/api';

type Ticker = NonNullable<SiteContent['ticker']>;

// Deliberately not a price tape: the items are course vocabulary, so nothing
// here can be mistaken for a live quote.
// Same seam trick as trust-strip: the set is rendered twice and the track
// shifts by exactly -50%, so the loop point is invisible.
export const TickerDivider = ({ ticker }: { ticker: Ticker | null }) => {
  const reduceMotion = useReducedMotion();
  if (!ticker) return null;

  const items = [...ticker.items, ...ticker.items];

  return (
    <div className="overflow-hidden border-y border-ink/10 py-3" aria-hidden="true">
      <div
        className={`flex w-max ${reduceMotion ? '' : 'animate-marquee'}`}
        style={reduceMotion ? undefined : { animationDuration: '70s' }}
      >
        {items.map((item, i) => (
          <span key={`${item}-${i}`} className="flex shrink-0 items-center">
            <span className="px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              {item}
            </span>
            <span className="h-1 w-1 shrink-0 bg-accent" />
          </span>
        ))}
      </div>
    </div>
  );
};
