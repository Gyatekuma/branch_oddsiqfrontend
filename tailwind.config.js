/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#06080f',
        surface: '#0d1018',
        border: '#1a2035',
        text: '#f1f5f9',
        muted: '#64748b',
        accent: '#d4a017',
        gold: '#d4a017',
        win: '#22c55e',
        draw: '#eab308',
        loss: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        display: ['Barlow Condensed', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'ticker': 'ticker 30s linear infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 5px #d4a017, 0 0 10px #d4a017, 0 0 15px #d4a017',
          },
          '50%': {
            boxShadow: '0 0 10px #d4a017, 0 0 20px #d4a017, 0 0 30px #d4a017',
          },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
