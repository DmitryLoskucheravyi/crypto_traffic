'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const HeroShader = dynamic(() => import('./hero-shader'), { ssr: false });

const CssPoster = () => (
  <div
    className="absolute inset-0 -z-10"
    style={{
      background:
        'radial-gradient(60% 50% at 50% 35%, hsl(var(--accent) / 0.16), transparent 70%), hsl(var(--bg))',
    }}
  />
);

export const HeroBackdrop = () => {
  const [shaderEnabled, setShaderEnabled] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    let hasWebGL = false;
    try {
      const canvas = document.createElement('canvas');
      hasWebGL = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      hasWebGL = false;
    }

    setShaderEnabled(!reduceMotion && !touchOnly && hasWebGL);
  }, []);

  if (!shaderEnabled) return <CssPoster />;

  return (
    <div className="absolute inset-0 -z-10">
      <HeroShader />
    </div>
  );
};
