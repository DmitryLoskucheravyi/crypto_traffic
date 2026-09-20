'use client';

import { useEffect, useRef, useState } from 'react';

const INTERACTIVE = 'a, button, [role="button"], input, select, textarea, [data-cursor="target"]';

// Terminal crosshair that replaces the pointer on fine-pointer devices.
// Never mounted on touch or with reduced motion, and `cursor: none` is applied
// from here for the same reason — if the component is not up, the real cursor
// must stay visible.
export const CrosshairCursor = () => {
  const [enabled, setEnabled] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: -100, y: -100 });
  const activeRef = useRef(false);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add('custom-cursor');

    let frame = 0;
    const render = () => {
      const node = wrapRef.current;
      if (node) {
        const { x, y } = targetRef.current;
        node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    const onMove = (event: PointerEvent) => {
      targetRef.current = { x: event.clientX, y: event.clientY };
      const overTarget = !!(event.target as Element | null)?.closest?.(INTERACTIVE);
      if (overTarget !== activeRef.current) {
        activeRef.current = overTarget;
        wrapRef.current?.classList.toggle('is-target', overTarget);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove('custom-cursor');
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={wrapRef} className="cursor-crosshair-root" aria-hidden="true">
      <span className="cursor-line cursor-line-h" />
      <span className="cursor-line cursor-line-v" />
      <span className="cursor-box" />
    </div>
  );
};
