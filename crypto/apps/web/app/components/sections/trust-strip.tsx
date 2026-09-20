'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp } from '../../lib/motion';

const ICONS = Array.from({ length: 11 }, (_, i) => `/${i + 1}.png`);

// Circuit traces between icons: every path enters at (0,28) and leaves at
// (96,28) — the icon centre line — so the thread stays connected however far it
// detours in between. Only a few traces carry a charge: a streak on every wire
// read as constant noise, so most of them are now just static circuitry.
// Timings are hand-picked rather than random so that both halves of the
// marquee render identically and the loop seam stays invisible.
type Charge = { dur: number; begin: number; len: number; reverse?: boolean };
type Wire = { d: string; charge?: Charge };

const WIRES: Wire[] = [
  { d: 'M0 28H96' },
  { d: 'M0 28H22V48H58V28H96' },
  { d: 'M0 28H30V8H66V28H96', charge: { dur: 6.8, begin: 0, len: 13 } },
  { d: 'M0 28H96' },
  { d: 'M0 28H16V44H40V28H62V12H84V28H96', charge: { dur: 7.6, begin: 2.4, len: 11 } },
  { d: 'M0 28H26V12H54V28H96' },
  { d: 'M0 28H96' },
  { d: 'M0 28H34V46H72V28H96', charge: { dur: 6.2, begin: 4.1, len: 10, reverse: true } },
  { d: 'M0 28H20V10H48V28H96' },
  { d: 'M0 28H24V47H52V28H96' },
  { d: 'M0 28H14V13H36V28H60V45H82V28H96', charge: { dur: 8.4, begin: 1.2, len: 9 } },
];

// The charge is a dash running along the trace itself rather than a separate
// shape moving over it, so it bends through the corners and can never overshoot
// the wire. pathLength normalises every trace to 100 units, so `len` is a share
// of the run and the dash offsets don't need each path's real length.
const Electron = ({ d, charge }: { d: string; charge: Charge }) => (
  <path
    d={d}
    pathLength={100}
    stroke="hsl(var(--accent))"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeDasharray={`${charge.len} 200`}
    strokeDashoffset={charge.len}
    style={{
      filter: 'drop-shadow(0 0 2px hsl(var(--accent))) drop-shadow(0 0 6px hsl(var(--accent) / 0.6))',
    }}
  >
    <animate
      attributeName="stroke-dashoffset"
      from={charge.reverse ? -100 : charge.len}
      to={charge.reverse ? charge.len : -100}
      dur={`${charge.dur}s`}
      begin={`${charge.begin}s`}
      repeatCount="indefinite"
    />
  </path>
);

export const TrustStrip = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section className="border-y border-ink/10 overflow-hidden">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={fadeUp}
        className="marquee-mask py-8"
      >
        {/* Track holds the set twice and shifts by exactly -50%; icon + wire
            blocks are all the same width, so the midpoint seam is invisible. */}
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {[...ICONS, ...ICONS].map((src, i) => {
            const wire = WIRES[i % WIRES.length];
            return (
              <div key={i} className="flex shrink-0 items-center">
                <Image
                  src={src}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  className="h-11 w-11 opacity-70 transition-opacity duration-standard ease-premium hover:opacity-100"
                />
                <svg width={96} height={56} viewBox="0 0 96 56" fill="none" className="shrink-0">
                  <path
                    d={wire.d}
                    stroke="hsl(var(--ink) / 0.18)"
                    strokeWidth="1"
                    shapeRendering="crispEdges"
                  />
                  {!reduceMotion && wire.charge && (
                    <Electron d={wire.d} charge={wire.charge} />
                  )}
                </svg>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
};
