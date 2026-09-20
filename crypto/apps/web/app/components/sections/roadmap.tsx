'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { content } from '../../lib/content';
import { RoadmapStage } from '../../lib/api';
import { fadeUp, DURATION, EASE } from '../../lib/motion';
import { RoadmapCard } from './roadmap-card';

export const Roadmap = ({ stages }: { stages: RoadmapStage[] }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !sectionRef.current || !pathRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    // The road draws itself top-down as the section scrolls: a clip that
    // retreats, not a redraw — the asset is a raster, so there is no stroke
    // to dash the way market-chart.tsx does it.
    const ctx = gsap.context(() => {
      gsap.fromTo(
        pathRef.current,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 65%',
            end: 'bottom 80%',
            scrub: 1,
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // No stages configured in the admin panel — the section does not exist.
  if (!stages.length) return null;

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-24 md:py-32">
      <div className="mx-auto max-w-container px-6 md:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
        >
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            {content.roadmap.eyebrow}
          </span>
          <h2 className="mt-4 max-w-2xl text-2xl font-semibold md:text-[2.125rem] md:leading-[1.12]">
            {content.roadmap.title}
          </h2>
          <p className="mt-3 max-w-xl text-ink-muted">{content.roadmap.sub}</p>
        </motion.div>
      </div>

      <div className="relative mx-auto mt-14 max-w-container px-6 md:mt-20 md:px-8">
        {/* Desktop: the road spans the whole block and the cards sit on top of
            it, so the ribbon reads as one continuous route between them rather
            than a strip squeezed into a middle lane. Faded at both ends so the
            vertical crop looks deliberate. */}
        <div
          ref={pathRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden select-none md:block"
          style={{
            maskImage:
              'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
          }}
        >
          <Image
            src="/roadmap-path.png"
            alt=""
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-center"
          />
        </div>

        {/* Mobile: no illustration, a plain rail keeps the sequence readable. */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-[30px] w-px bg-ink/10 md:hidden"
        />

        <ol className="relative space-y-8 md:space-y-10">
          {stages.map((stage, i) => {
            const onRight = i % 2 === 0; // stage 1 sits right, as on the reference

            return (
              <motion.li
                key={stage._id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                // Named states, not inline values: the card below reads the
                // same state names and runs its own cascade off them.
                variants={{
                  hidden: { opacity: 0, x: onRight ? 24 : -24 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    transition: { duration: DURATION.standard, ease: EASE },
                  },
                }}
                className="relative pl-12 md:grid md:grid-cols-2 md:gap-10 md:pl-0 lg:gap-16"
              >
                {/* Mobile only: with no illustration the rail is what carries
                    the sequence. On desktop the road already does that. */}
                <span
                  aria-hidden="true"
                  className="absolute left-[26px] top-8 h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_12px_hsl(var(--accent)/0.7)] md:hidden"
                />

                <div className={onRight ? 'md:col-start-2' : 'md:col-start-1'}>
                  <RoadmapCard stage={stage} />
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};
