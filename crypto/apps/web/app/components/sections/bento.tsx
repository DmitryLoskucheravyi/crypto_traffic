'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { content } from '../../lib/content';
import {
  MaterialsStack,
  RefreshCycle,
  Community,
  SupportShield,
  ChartPulse,
  CtaArrow,
} from '../icons';
import { fadeUp, DURATION, EASE } from '../../lib/motion';

const ICONS = {
  materials: MaterialsStack,
  refresh: RefreshCycle,
  community: Community,
  support: SupportShield,
  chart: ChartPulse,
};

const CELLS = content.bento.cells;
const COUNT = CELLS.length;

// The track holds three copies of the set and lives in the middle one. When the
// scroll settles outside that copy it is shifted by exactly one block width,
// which puts an identical card in an identical place — so the carousel runs
// forever in both directions with nothing to see at the seam.
const COPIES = 3;
const ITEMS = [...CELLS, ...CELLS, ...CELLS];
const HOME = COUNT;

const IDLE_MS = 160;

// The overlay that lifts the card copy off the photo. Spelled out here rather
// than as a utility because it is the only place in the app that needs it.
const CARD_SCRIM =
  'linear-gradient(0deg, hsl(var(--surface)) 0%, hsl(var(--surface) / 0.85) 30%, transparent 70%)';

const pad = (n: number) => String(n).padStart(2, '0');

const column = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE } },
};

export const Bento = () => {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);

  // `active` is read from scrollLeft, so a manual swipe and an automatic
  // advance agree on which card is current. The fill of the current segment is
  // not state at all — it is a CSS animation, and its completion is what
  // advances the track.
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);

  // Absolute index into ITEMS (0..14), as opposed to `active`, which is the
  // card's index within one copy.
  const absRef = useRef(HOME);
  const dragRef = useRef({ startX: 0, startScroll: 0, active: false });

  // Positions are derived from live rects rather than offsetLeft so the maths
  // holds regardless of which ancestor happens to be positioned.
  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return null;
    const children = Array.from(el.children) as HTMLElement[];
    if (children.length <= COUNT) return null;
    const origin = el.getBoundingClientRect().left;
    const left = (i: number) => el.scrollLeft + children[i].getBoundingClientRect().left - origin;
    const block = left(COUNT) - left(0);
    if (block <= 0) return null;
    return { el, children, left, block, origin };
  }, []);

  const nearestIndex = useCallback(() => {
    const m = measure();
    if (!m) return absRef.current;
    let best = 0;
    let bestDistance = Infinity;
    m.children.forEach((child, i) => {
      const distance = Math.abs(child.getBoundingClientRect().left - m.origin);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    return best;
  }, [measure]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const m = measure();
      if (!m) return;
      const i = Math.max(0, Math.min(ITEMS.length - 1, index));
      m.el.scrollTo({ left: m.left(i), behavior: reduceMotion ? 'auto' : 'smooth' });
    },
    [measure, reduceMotion],
  );

  // Only ever called once the scroll has settled: teleporting mid-animation
  // would cancel a smooth scroll, and mid-drag it would yank the pointer
  // baseline out from under the cursor.
  //
  // The test is on the settled card index, not on pixels: comparing scrollLeft
  // against the block bounds needs an epsilon for subpixel drift, and an
  // epsilon wide enough to be safe also lets the track sit a whole card into
  // the next copy, which eats the runway that keeps the right edge filled.
  const recenter = useCallback(() => {
    const m = measure();
    if (!m || dragRef.current.active) return;
    const abs = nearestIndex();
    if (abs >= HOME + COUNT) m.el.scrollLeft -= m.block;
    else if (abs < HOME) m.el.scrollLeft += m.block;
  }, [measure, nearestIndex]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const read = () => {
      const abs = nearestIndex();
      absRef.current = abs;
      setActive(abs % COUNT);
    };

    let frame = 0;
    let idle = 0;
    const onScroll = () => {
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        recenter();
        read();
      }, IDLE_MS);
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        read();
      });
    };

    // Card widths are viewport-relative, so a resize moves every snap point.
    // Re-anchor to the card that is already showing — jumping home here would
    // make the carousel lurch every time a mobile browser collapses its URL
    // bar, which fires resize.
    const relayout = () => {
      const m = measure();
      if (!m) return;
      m.el.scrollLeft = m.left(absRef.current);
      read();
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', relayout);

    // Start on the middle copy. Every copy renders the same cards, so doing
    // this after mount rather than before paint is invisible.
    const m = measure();
    if (m) m.el.scrollLeft = m.left(HOME);
    read();

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', relayout);
      window.clearTimeout(idle);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [measure, nearestIndex, recenter]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.2,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || event.pointerType !== 'mouse') return;
    dragRef.current = { startX: event.clientX, startScroll: el.scrollLeft, active: true };
    // Mandatory snapping fights every scrollLeft write, so it is suspended for
    // the duration of the drag and re-armed on release.
    el.style.scrollSnapType = 'none';
    el.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || !dragRef.current.active) return;
    el.scrollLeft = dragRef.current.startScroll - (event.clientX - dragRef.current.startX);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || !dragRef.current.active) return;
    dragRef.current.active = false;
    el.style.scrollSnapType = '';
    if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    setDragging(false);
    scrollToIndex(nearestIndex());
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    scrollToIndex(absRef.current + (event.key === 'ArrowRight' ? 1 : -1));
  };

  // Jump to the copy of card `i` closest to where we already are, so tapping a
  // segment never scrolls the length of the whole track.
  const goToCell = (i: number) => {
    const current = absRef.current;
    scrollToIndex(Math.round((current - i) / COUNT) * COUNT + i);
  };

  const next = (active + 1) % COUNT;

  return (
    <section className="overflow-x-clip py-24 md:py-32">
      <div className="max-w-container mx-auto px-6 md:px-8">
        <div className="md:grid md:grid-cols-10 md:gap-12">
          {/* Left rail — sticks alongside the track on desktop, stacks above it
              on mobile. */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={column}
            className="md:col-span-3 md:sticky md:top-28 md:self-start"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 px-3 py-1.5 font-mono text-xs tabular-nums">
              <span className="text-accent">{pad(active + 1)}</span>
              <span className="text-ink-muted">—</span>
              <span className="text-ink-muted">{pad(COUNT)}</span>
            </span>

            <h2 className="mt-6 max-w-md font-display text-3xl uppercase leading-[0.95] tracking-tight md:text-5xl">
              {content.bento.title}
            </h2>
            <p className="mt-5 max-w-md text-ink-muted">{content.bento.sub}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-accent/40 px-4 py-2 font-mono text-xs uppercase tracking-wider text-accent shadow-[0_0_24px_-6px_hsl(var(--accent)/0.6)]">
                {content.bento.badge}
              </span>
              <a
                href="#courses"
                className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface px-4 py-2 text-sm text-ink transition-colors duration-standard ease-premium hover:border-accent/40 hover:text-accent"
              >
                {content.bento.more}
                <CtaArrow size={16} />
              </a>
            </div>
          </motion.div>

          {/* Right rail — bleeds past the container to the viewport edge so the
              track visibly continues off screen. */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            className="group/track relative mt-12 md:col-span-7 md:mt-0 mr-[calc(-1.5rem_-_max(0px,(100vw_-_1280px)/2))] md:mr-[calc(-2rem_-_max(0px,(100vw_-_1280px)/2))]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            {/* Progress segments double as the autoplay clock: segments before
                the current card are solid, the current one fills over the dwell
                time, and reaching the end of that fill is what advances the
                track. Hovering, dragging or scrolling the section out of view
                parks the animation where it stands instead of restarting it. */}
            <div className="mb-6 flex gap-2 pr-6 md:pr-8">
              {CELLS.map((cell, i) => {
                const isActive = i === active;
                const running = isActive && !reduceMotion && inView;
                return (
                  <button
                    key={cell.title}
                    type="button"
                    aria-label={cell.title}
                    onClick={() => goToCell(i)}
                    className="h-1 flex-1 overflow-hidden rounded-full bg-ink/10"
                  >
                    <span
                      className={`block h-full origin-left rounded-full bg-accent ${
                        running ? 'animate-segment-fill' : ''
                      }`}
                      style={{
                        // The animation overrides this while it runs; it is the
                        // resting value, so a segment never flashes full before
                        // its fill starts.
                        transform: `scaleX(${i < active || (reduceMotion && isActive) ? 1 : 0})`,
                        ...(running
                          ? { animationPlayState: paused || dragging ? 'paused' : 'running' }
                          : null),
                      }}
                      onAnimationEnd={() => {
                        if (isActive) scrollToIndex(absRef.current + 1);
                      }}
                    />
                  </button>
                );
              })}
            </div>

            <div
              ref={trackRef}
              role="region"
              aria-label={content.bento.title}
              tabIndex={0}
              onKeyDown={onKeyDown}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className={`no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pr-6 outline-none md:pr-8 ${
                dragging ? 'cursor-grabbing select-none' : 'cursor-grab'
              }`}
            >
              {ITEMS.map((cell, i) => {
                const Icon = ICONS[cell.icon];
                const isActive = i % COUNT === active;
                const copy = Math.floor(i / COUNT);
                return (
                  <article
                    key={`${cell.title}-${i}`}
                    // Only the middle copy is exposed to assistive tech; the
                    // two padding copies would otherwise read as duplicates.
                    aria-hidden={copy !== 1 || undefined}
                    className={`relative aspect-[3/4] w-[80vw] shrink-0 snap-start overflow-hidden rounded-3xl border border-ink/10 bg-surface md:w-[420px] ${
                      reduceMotion
                        ? ''
                        : `transition-[opacity,transform] duration-standard ease-premium ${
                            isActive ? 'scale-100 opacity-100' : 'scale-[0.92] opacity-45'
                          }`
                    }`}
                  >
                    <Image
                      src={cell.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 80vw, 420px"
                      className="object-cover"
                      draggable={false}
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      style={{ backgroundImage: CARD_SCRIM }}
                    />
                    <span className="absolute left-7 top-7 inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-surface/70 text-accent backdrop-blur">
                      <Icon size={20} />
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-7">
                      <span className="font-mono text-xs tabular-nums text-accent/60">
                        {pad((i % COUNT) + 1)}
                      </span>
                      <h3 className="mt-2 font-display text-xl uppercase leading-tight md:text-2xl">
                        {cell.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{cell.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* The offset is measured back from the viewport edge, past the
                rail's own full-bleed margin, so the arrow sits inside the
                container gutter instead of out at the screen edge. */}
            <button
              type="button"
              aria-label={CELLS[next].title}
              onClick={() => scrollToIndex(absRef.current + 1)}
              className="absolute right-8 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-surface/80 text-ink opacity-0 backdrop-blur transition-opacity duration-standard ease-premium hover:text-accent focus-visible:opacity-100 group-hover/track:opacity-100 md:right-[calc(4rem_+_max(0px,(100vw_-_1280px)/2))]"
            >
              <CtaArrow size={20} />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
