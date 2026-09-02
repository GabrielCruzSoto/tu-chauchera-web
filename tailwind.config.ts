import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Glassmorphism surface tokens
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
          hover: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.12)',
        },
        // Neon accent palette
        neon: {
          green: '#39ff8f',   // Savings, synced, paid
          red: '#ff4d6d',     // Deficit, error, danger
          blue: '#4d9fff',    // Primary accent, syncing
          yellow: '#ffd166',  // Warning, upcoming due, pending
          purple: '#b388ff',  // Renegotiated, info
        },
        // Base background
        bg: {
          deep: '#0a0a1a',    // Page background
          surface: '#111127', // Card/panel background
          elevated: '#1a1a35',// Elevated component background
        },
      },
      backdropBlur: {
        glass: '10px',
      },
      borderRadius: {
        glass: '12px',
      },
      animation: {
        'pulse-neon': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
