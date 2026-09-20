import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: 'hsl(var(--bg))' },
        surface: { DEFAULT: 'hsl(var(--surface))' },
        raised: { DEFAULT: 'hsl(var(--raised))' },
        ink: { DEFAULT: 'hsl(var(--ink))', muted: 'hsl(var(--ink-muted))' },
        accent: { DEFAULT: 'hsl(var(--accent))' },
        danger: { DEFAULT: 'hsl(var(--danger))' },
        warn: { DEFAULT: 'hsl(var(--warn))' },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      maxWidth: { container: '1280px' },
      keyframes: {
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'toast-in': 'toast-in 180ms cubic-bezier(0.4, 0, 0.2, 1)',
        skeleton: 'pulse 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
