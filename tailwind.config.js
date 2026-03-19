/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        electric: {
          50: '#e0f7ff',
          100: '#b3ecff',
          200: '#80e0ff',
          300: '#4dd4ff',
          400: '#00c9ff',
          500: '#00b8f0',
          600: '#0099cc',
          700: '#007aa3',
          800: '#005c7a',
          900: '#003d52',
        },
        cyan: {
          50: '#e0ffff',
          100: '#b3f5ff',
          200: '#80f0ff',
          300: '#4de6ff',
          400: '#1ad9ff',
          500: '#00d4ff',
          600: '#00b3d9',
          700: '#0092b3',
          800: '#00708c',
          900: '#004d66',
        },
        neon: {
          50: '#e6fcff',
          100: '#ccf9ff',
          200: '#99f3ff',
          300: '#66edff',
          400: '#33e7ff',
          500: '#00e1ff',
          600: '#00c7e6',
          700: '#00a8cc',
          800: '#0089b3',
          900: '#006a99',
        },
        slate: {
          850: '#0f1724',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'spotlight': 'radial-gradient(circle at 50% 0%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(0, 225, 255, 0.3)',
        'glow-md': '0 0 20px rgba(0, 225, 255, 0.4)',
        'glow-lg': '0 0 30px rgba(0, 225, 255, 0.5)',
        'glow-cyan': '0 0 30px rgba(0, 212, 255, 0.6)',
        'glow-electric': '0 0 30px rgba(0, 201, 255, 0.6)',
        'inner-glow': 'inset 0 0 20px rgba(0, 225, 255, 0.1)',
        'neon-glow': '0 0 40px rgba(0, 225, 255, 0.8), 0 0 80px rgba(0, 225, 255, 0.4)',
      },
    },
  },
  plugins: [],
};
