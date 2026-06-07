/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      keyframes: {
        'pulse-border': {
          '0%, 100%': {
            'border-color': 'rgba(59, 130, 246, 0.2)',
            'box-shadow': '0 0 10px rgba(59, 130, 246, 0.08)',
          },
          '50%': {
            'border-color': 'rgba(59, 130, 246, 0.5)',
            'box-shadow': '0 0 15px rgba(59, 130, 246, 0.15)',
          },
        },
        'background-light-sweep': {
          '0%': {
            transform: 'translate3d(-150%, 0, 0) skewX(-20deg)',
            opacity: '0',
          },
          '8%': {
            opacity: '0',
          },
          '18%': {
            opacity: '0.3',
          },
          '32%': {
            opacity: '0.3',
          },
          '42%': {
            transform: 'translate3d(850%, 0, 0) skewX(-20deg)',
            opacity: '0',
          },
          '100%': {
            transform: 'translate3d(850%, 0, 0) skewX(-20deg)',
            opacity: '0',
          },
        },
      },
      animation: {
        'pulse-border': 'pulse-border 2s infinite ease-in-out',
        'light-sweep':
          'background-light-sweep 22s cubic-bezier(0.22, 1, 0.36, 1) infinite',
      },
    },
  },
  plugins: [],
};
