/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#07090d',
        panel: '#0d1118',
        panelhead: '#11161f',
        line: '#1f2733',
        amber: '#ffb000',
        up: '#22c55e',
        down: '#ef4444',
        warn: '#eab308',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
