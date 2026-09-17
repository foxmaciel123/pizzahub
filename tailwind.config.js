/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pizza: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          900: '#7c2d12',
          950: '#431407',
        },
        cream: {
          50: '#fffcf7',
          100: '#fdf6ea',
          200: '#f8ecd8',
        },
        clay: {
          50: '#fdf4ee',
          100: '#f9e2d2',
          200: '#f0c19b',
          400: '#d98a52',
          500: '#c96a35',
          600: '#b0512a',
          700: '#8f3f23',
          900: '#4a2114',
        },
        ink: {
          50: '#f5f4f2',
          200: '#d9d5cf',
          400: '#8a8178',
          600: '#4a423b',
          800: '#2a2521',
          900: '#1c1815',
          950: '#120f0d',
        },
        sage: {
          400: '#8a9a72',
          500: '#6b7d51',
          600: '#556640',
        }
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
