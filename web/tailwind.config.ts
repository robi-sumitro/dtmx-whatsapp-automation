/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#06060c',
          900: '#0b0c16',
          800: '#12131f',
          700: '#1a1c2b',
        },
        aurora: {
          400: '#7ef0ff',
          500: '#38cfff',
          600: '#12a2e0',
        },
        ember: {
          400: '#ff9a62',
          500: '#ff7a45',
        },
        violetine: {
          400: '#b78bff',
          500: '#9770f0',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(56,207,255,0.15), 0 20px 60px -20px rgba(56,207,255,0.25)',
      },
      backgroundImage: {
        'mesh-light':
          'radial-gradient(60% 50% at 20% 0%, rgba(56,207,255,0.18), transparent 60%), radial-gradient(50% 40% at 80% 20%, rgba(183,139,255,0.16), transparent 60%), radial-gradient(40% 40% at 60% 100%, rgba(255,122,69,0.12), transparent 60%)',
      },
    },
  },
  plugins: [],
};