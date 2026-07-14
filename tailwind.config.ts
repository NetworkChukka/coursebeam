import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0D1117',
          light: '#F7F8FA',
        },
        surface: {
          DEFAULT: '#161B22',
          hover: '#1C232C',
          light: '#FFFFFF',
          lightHover: '#F0F2F5',
        },
        border: {
          DEFAULT: '#2A313C',
          light: '#E2E5EA',
        },
        ink: {
          DEFAULT: '#E6EDF3',
          muted: '#8B98A5',
          light: '#0D1117',
          lightMuted: '#5B6572',
        },
        teal: {
          DEFAULT: '#2DD4BF',
          dim: '#1C8F82',
        },
        amber: {
          DEFAULT: '#F2A93B',
          dim: '#B87D22',
        },
        success: '#4ADE80',
        danger: '#F87171',
      },
      fontFamily: {
        display: ['var(--font-lexend)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jbmono)', 'monospace'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'reel-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'reel-spin': 'reel-spin 3s linear infinite',
        'fade-up': 'fade-up 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
