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
        'dark-bg': '#0f172a',
        'track-bg': '#1e293b',
        'kick-active': '#4ade80',
        'snare-active': '#22d3ee',
        'hihat-active': '#facc15',
      }
    },
  },
  plugins: [],
}
