import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: 'hsl(var(--bg))' },
        surface: { DEFAULT: 'hsl(var(--surface))' },
        ink: { DEFAULT: 'hsl(var(--ink))', muted: 'hsl(var(--ink-muted))' },
        accent: { DEFAULT: 'hsl(var(--accent))' },
        danger: { DEFAULT: 'hsl(6 70% 55%)' },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      maxWidth: { container: '1000px' },
    },
  },
  plugins: [],
} satisfies Config;
