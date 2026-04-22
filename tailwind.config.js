/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void:    '#03050d',
        surface: '#080d1a',
        panel:   '#0d1424',
        rim:     '#1a2540',
        neon: {
          green:  '#00ff88',
          amber:  '#ffb700',
          red:    '#ff3366',
          blue:   '#00b4ff',
          purple: '#a855f7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-green':  '0 0 12px rgba(0,255,136,0.45), 0 0 30px rgba(0,255,136,0.15)',
        'glow-amber':  '0 0 12px rgba(255,183,0,0.45),  0 0 30px rgba(255,183,0,0.15)',
        'glow-red':    '0 0 12px rgba(255,51,102,0.45),  0 0 30px rgba(255,51,102,0.15)',
        'glow-blue':   '0 0 12px rgba(0,180,255,0.45),   0 0 30px rgba(0,180,255,0.15)',
        'glow-purple': '0 0 12px rgba(168,85,247,0.45),  0 0 30px rgba(168,85,247,0.15)',
        'glass':       '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'grid-lines': `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                       linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
        'scan':       'scan 4s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.7' },
          '50%':      { opacity: '1' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
}
