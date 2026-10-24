/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0F1E36',
          800: '#16233B',
          700: '#23334E',
          600: '#3D4F6E',
          500: '#5F7292',
          400: '#8A9DBA',
          300: '#BDC9DC',
          200: '#E2E8F0',
          100: '#F1F5F9',
        },
        accent: {
          DEFAULT: '#FF6B35',
          hover: '#FA5A1E',
          light: '#FFF0EA',
          border: '#FFD5C4',
        },
        lime: {
          DEFAULT: '#D2F54D',
          hover: '#C4EC38',
          light: '#F3FDCE',
          dark: '#1C2C0B',
        },
        brand: {
          teal: '#9EE3DB',
          peach: '#FBD9CB',
          mist: '#F5F8FA',
          frame: '#0F1E36',
        },
        aqi: {
          good: '#00875A',       // WCAG-compliant deep emerald
          moderate: '#B45309',   // WCAG-compliant amber-700
          poor: '#EA580C',       // Orange
          verypoor: '#C2410C',   // Deep Orange
          severe: '#DC2626',     // Crimson
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '40px',
      },
      boxShadow: {
        'frame': '0 30px 80px -15px rgba(15, 30, 54, 0.2), 0 0 0 3px #0F1E36',
        'frame-inner': 'inset 0 2px 4px rgba(255, 255, 255, 0.8)',
        'soft': '0 4px 20px -2px rgba(15, 30, 54, 0.05)',
        'soft-hover': '0 12px 30px -4px rgba(15, 30, 54, 0.1)',
        'chip': '0 2px 8px rgba(15, 30, 54, 0.04)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-gentle': 'floatGentle 4s ease-in-out infinite',
      },
      keyframes: {
        floatGentle: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
