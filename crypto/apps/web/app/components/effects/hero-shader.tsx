'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uScroll;
  uniform vec3 uColorBg;
  uniform vec3 uColorAccent;
  uniform vec3 uColorInk;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 3.0;
    p.x += uTime * 0.025;
    p.y -= uScroll * 1.4;

    float n1 = noise(p);
    float n2 = noise(p * 1.8 + 10.0);
    float glass = smoothstep(0.3, 0.9, n1 * 0.6 + n2 * 0.4);

    float vignette = smoothstep(1.1, 0.15, distance(uv, vec2(0.5, 0.38)));

    vec3 col = mix(uColorBg, uColorAccent, glass * 0.35 * vignette);
    col = mix(col, uColorInk, glass * 0.06 * vignette);

    float alpha = vignette * (0.3 + glass * 0.22);
    gl_FragColor = vec4(col, alpha);
  }
`;

function GlassPlane() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const scrollProgress = useRef(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        scrollProgress.current = self.progress;
      },
    });
    return () => trigger.kill();
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uColorBg: { value: new THREE.Color('#0B0B0D') },
      uColorAccent: { value: new THREE.Color('#C9A24B') },
      uColorInk: { value: new THREE.Color('#F2EFE9') },
    }),
    [],
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uScroll.value = scrollProgress.current;
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
      />
    </mesh>
  );
}

export default function HeroShader() {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
    >
      <GlassPlane />
    </Canvas>
  );
}
