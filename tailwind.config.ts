import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: '#1e1b4b',
          'indigo-light': '#312e81',
          terracotta: '#c2410c',
          'terracotta-light': '#ea580c',
          gold: '#d97706',
          'gold-light': '#f59e0b',
          cream: '#fefce8',
          'cream-dark': '#fef9c3',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'tie-dye':
          'radial-gradient(ellipse at top left, #312e81 0%, #1e1b4b 40%, #c2410c 100%)',
        'hero-gradient':
          'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #7c2d12 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
