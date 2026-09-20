import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: 'hsl(var(--bg))' },
        surface: { DEFAULT: 'hsl(var(--surface))' },
        ink: { DEFAULT: 'hsl(var(--ink))', muted: 'hsl(var(--ink-muted))' },
        accent: { DEFAULT: 'hsl(var(--accent))', soft: 'hsl(var(--accent-soft))' },
        bear: { DEFAULT: 'hsl(var(--bear))' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'var(--font-geist-sans)', 'sans-serif'],
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      maxWidth: { container: '1280px' },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        quick: '250ms',
        standard: '400ms',
        slow: '600ms',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'segment-fill': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        // Tier bars on the course cards: idle they are a static rank readout,
        // on hover they behave like an audio meter.
        'eq-bounce': {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(0.42)' },
        },
        // The final CTA's glow — the panel breathes instead of sitting still.
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        caret: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        // The single source of truth for the bento carousel's dwell time: the
        // segment finishing its fill is what advances the track.
        'segment-fill': 'segment-fill 5s linear forwards',
        'eq-bounce': 'eq-bounce 820ms cubic-bezier(0.4, 0, 0.2, 1) infinite',
        breathe: 'breathe 6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        caret: 'caret 1.1s steps(1, end) infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
