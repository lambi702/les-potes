/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        arcade: ['"Press Start 2P"', 'cursive'],
        display: ['"Baloo 2"', 'sans-serif'],
      },
      colors: {
        potes: {
          bg: '#1a0d0d',
          panel: '#3a1414',
          panel2: '#4d1c1c',
          red: '#d21f3c',
          gold: '#f4b73f',
          flame: '#ff6b35',
          green: '#2fae7a',
        },
      },
      boxShadow: {
        pixel: '4px 4px 0 0 rgba(0,0,0,0.35)',
        'pixel-sm': '2px 2px 0 0 rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
}
