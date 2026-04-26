import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx,mdx}',
    './src/components/**/*.{ts,tsx,mdx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brutal palette (DOSYA 2 — design system)
        brutal: {
          yellow: '#FFD700',
          black: '#000000',
          white: '#FFFFFF',
          red: '#FF3B30',
          green: '#34C759',
          orange: '#FF6600',
        },
      },
      fontFamily: {
        // CSS variables wired via next/font in app/layout.tsx
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        brutal: '4px 4px 0 0 #000',
        'brutal-lg': '8px 8px 0 0 #000',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
};

export default config;
