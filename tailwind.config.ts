import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        moko: {
          pink: '#FF8FC6',
          rose: '#FF5DA0',
          purple: '#C084FC',
          violet: '#8B5CF6',
          blue: '#60A5FA',
          cyan: '#22D3EE',
          yellow: '#FACC15',
          mint: '#6EE7B7',
          cream: '#FFF7ED',
          gold: '#FCD34D',
        },
      },
      fontFamily: {
        rounded: ['ui-rounded', 'Hiragino Maru Gothic ProN', 'Quicksand', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
export default config;
