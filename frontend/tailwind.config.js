/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        samurai: {
          50: '#fdf4f4',
          100: '#fbe8e8',
          200: '#f7d5d5',
          300: '#f0b5b5',
          400: '#e58888',
          500: '#dc2626', // Crimson red
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#450a0a',
          950: '#260404'
        },
        dojo: {
          800: '#181b22',
          850: '#13151b',
          900: '#0d0f14',
          950: '#08090c'
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706'
        }
      }
    },
  },
  plugins: [],
}

