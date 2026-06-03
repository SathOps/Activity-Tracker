/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
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
      },
      animation: {
        'pulse-border': 'pulse-border 2s infinite ease-in-out',
      },
    },
  },
  plugins: [],
};
