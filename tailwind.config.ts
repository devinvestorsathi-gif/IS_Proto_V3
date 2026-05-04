import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background:   '#0A0A0F',
        surface:      '#12121A',
        'surface-raised': '#1A1A26',
        gold:         '#C9A84C',
        'gold-muted': '#9A7A32',
        'text-primary':   '#F5F5F0',
        'text-secondary': '#9A9A8A',
        border:       '#2A2A38',
        success:      '#2D6A4F',
        danger:       '#7B2D2D',
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body:    ['system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
}

export default config