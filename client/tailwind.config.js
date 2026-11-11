/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        school: {
          yellow: '#F5DC96',
          apricot: '#E89848',
          red: '#B83226',
          crimson: '#7C1224',
          navy: '#1A2A44',
          cyan: '#1A8CDB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
