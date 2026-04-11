/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './scripts.js'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Work Sans"', 'system-ui', 'sans-serif'],
        mono: ['monospace'],
      },
    },
  },
  plugins: [],
};
