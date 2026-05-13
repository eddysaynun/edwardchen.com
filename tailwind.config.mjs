import { defineConfig } from 'tailwindcss';

export default defineConfig({
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        muted: 'var(--muted)',
        'muted-2': 'var(--muted-2)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        selection: 'var(--selection)',
      },
      fontFamily: {
        mono: ['var(--mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['var(--sans)', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['var(--serif)', 'ui-serif', 'Georgia', 'serif'],
      },
      maxWidth: {
        col: 'var(--col)',
      },
      spacing: {
        'row-pad': 'var(--row-pad)',
      },
      borderRadius: {
        radius: 'var(--radius)',
      },
      animation: {
        blink: 'blink 1.1s steps(2) infinite',
        pulse: 'pulse 2.4s ease-out infinite',
        rise: 'rise 0.5s ease both',
      },
      keyframes: {
        blink: {
          '50%': { opacity: '0' },
        },
        pulse: {
          '70%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
    },
  },
  plugins: [],
});
