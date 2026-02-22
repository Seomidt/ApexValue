import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gulf: {
          blue: '#002776',
          orange: '#FF6319',
          powder: '#B9D9EB',
          'orange-alt': '#FF671F',
          'blue-light': '#003a99',
          'blue-dark': '#001a55',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gulf-gradient': 'linear-gradient(135deg, #002776 0%, #003a99 50%, #002776 100%)',
        'cockpit-bg': 'linear-gradient(180deg, #001a55 0%, #002776 100%)',
      },
      boxShadow: {
        'gulf': '0 4px 24px rgba(0, 39, 118, 0.2)',
        'gulf-lg': '0 8px 48px rgba(0, 39, 118, 0.3)',
        'orange-glow': '0 0 20px rgba(255, 99, 25, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
