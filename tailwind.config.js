/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        garden: {
          50:  '#f0faf5',
          100: '#dcf5e8',
          200: '#b7e4c7',
          300: '#95d5b2',
          400: '#52b788',
          500: '#40916c',
          600: '#2d6a4f',
          700: '#1b4332',
          800: '#143326',
          900: '#0d1f17',
        },
        soil: {
          100: '#f5f0eb',
          200: '#d4b896',
          300: '#b8956a',
          400: '#9c7348',
          500: '#7d5c3a',
        },
        harvest: '#e07a5f',
      },
    },
  },
  plugins: [],
}
