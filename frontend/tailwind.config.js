/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#090d16',
        darkCard: 'rgba(30, 41, 59, 0.45)',
        darkBorder: 'rgba(255, 255, 255, 0.08)',
        accentCyan: '#06b6d4',
        accentPurple: '#a855f7',
        accentBlue: '#3b82f6',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
