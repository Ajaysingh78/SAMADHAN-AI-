/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          50: '#f0f6ff',
          100: '#e0edfe',
          200: '#b9dbfe',
          300: '#7cbcfd',
          400: '#369af9',
          500: '#0c7fe9',
          600: '#0263c7',
          700: '#024ea1',
          800: '#064384',
          900: '#0b396e',
          950: '#072449'
        },
        slate: {
          850: '#152033',
          900: '#0f172a',
          950: '#090d16'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
