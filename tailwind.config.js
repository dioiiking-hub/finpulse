/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // shadcn tokens (kept for ui/* components)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // FinPulse design tokens (design.md §2)
        'bg-0': '#070A0E',
        'bg-1': '#0B0F14',
        'surface-1': '#10161E',
        'surface-2': '#151D27',
        'surface-3': '#1B2531',
        line: 'rgba(151,178,205,0.10)',
        'text-1': '#E9EEF4',
        'text-2': '#9DAAB8',
        'text-3': '#5F7183',
        gold: {
          DEFAULT: '#D8A94E',
          hover: '#E9C06E',
        },
        'on-gold': '#14100A',
        up: '#E5484D',
        down: '#35B37E',
        'us-blue': '#6E9FFF',
        'heat-cool': '#3D6DB5',
        'heat-hot': '#E5484D',
        cat: {
          macro: '#D8A94E',
          us: '#6E9FFF',
          cn: '#E5484D',
          cmdty: '#C7824F',
          tech: '#9B8CF2',
          reg: '#43B8A9',
          crypto: '#D4789E',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Noto Sans SC"', 'sans-serif'],
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SFMono-Regular"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        lift: '0 8px 30px rgba(0,0,0,.35)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'pulse-dot': {
          '0%,100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.35)', opacity: '.7' },
        },
        'flash-gold': {
          '0%,100%': { opacity: '0' },
          '25%,60%': { opacity: '1' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        shine: {
          from: { backgroundPosition: '200% center' },
          to: { backgroundPosition: '-200% center' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        marquee: 'marquee 40s linear infinite',
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'flash-gold': 'flash-gold 1.2s ease-in-out 2',
        shimmer: 'shimmer 1.4s linear infinite',
        shine: 'shine 1.2s linear 1',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
