'use client';

import { useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

const PULL_RADIUS = 24; // px outside the element where the pull starts
const MAX_OFFSET = 8; // px the element ever travels

// Magnetic CTA: the button leans towards the cursor and springs back.
// Listeners live on the element itself, not on window — one CTA should not
// cost a global pointermove handler.
export function useMagnetic<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 250, damping: 20 });
  const y = useSpring(useMotionValue(0), { stiffness: 250, damping: 20 });

  const onPointerMove = (event: React.PointerEvent) => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;

    const rect = node.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;

    const reach = Math.max(rect.width, rect.height) / 2 + PULL_RADIUS;
    const strength = Math.min(1, Math.hypot(dx, dy) / reach);

    x.set((dx / reach) * MAX_OFFSET * (1 - strength * 0.4));
    y.set((dy / reach) * MAX_OFFSET * (1 - strength * 0.4));
  };

  const onPointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { ref, style: { x, y }, onPointerMove, onPointerLeave };
}
