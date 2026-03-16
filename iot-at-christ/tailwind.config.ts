import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './emails/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Christ University brand tokens
        'christ-navy':    '#1B2E4B',
        'christ-saffron': '#E8720C',
        'christ-gold':    '#B7791F',
        'christ-green':   '#1A7A4A',
        'christ-red':     '#C0392B',
        'christ-bg':      '#F7F8FA',
        // Research Lab dark theme
        'research-bg':    '#0D0B08',
        'research-amber': '#F5A623',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body:    ['"Source Serif 4"', 'serif'],
        mono:    ['"Courier Prime"', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
