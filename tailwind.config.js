/** @type {import('tailwindcss').Config} */
const c = (v) => `rgb(var(${v}) / <alpha-value>)`;
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: c('--bg'),
        surface: c('--surface'),
        surface2: c('--surface-2'),
        line: c('--line'),
        fg: c('--fg'),
        fg2: c('--fg-2'),
        fg3: c('--fg-3'),
        accent: c('--accent'),
        accent2: c('--accent-2'),
        accent3: c('--accent-3'),
        violet: c('--violet'),
        accentInk: c('--accent-ink'),
        onAccent: c('--on-accent'),
        easy: c('--easy'),
        medium: c('--medium'),
        hard: c('--hard'),
        extreme: c('--extreme'),
        danger: c('--danger'),
      },
      fontFamily: {
        display: ['Outfit', 'Avenir Next', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'Avenir Next', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: { '2xl': '1.25rem', '3xl': '1.75rem' },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--accent) / 0.35), 0 8px 40px -8px rgb(var(--accent) / 0.45)',
        card: '0 1px 0 rgb(var(--fg) / 0.03), 0 12px 32px -16px rgb(0 0 0 / 0.35)',
      },
    },
  },
  plugins: [],
};
