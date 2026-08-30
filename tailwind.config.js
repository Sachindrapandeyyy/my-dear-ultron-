/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ultron: {
          crimson: '#ff1e42',
          red: '#dc2626',
          amber: '#ffaa30',
          cyan: '#00f0ff',
          blue: '#0070f3',
          purple: '#a855f7',
          dark: '#08080c',
          card: '#0e0e17',
          border: '#1f1f2e',
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'scan': 'scan 4s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 15px rgba(255, 30, 66, 0.4))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 35px rgba(255, 30, 66, 0.8))' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
}
