/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--color-border)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        primary: {
          DEFAULT: "var(--color-primary)", /* RFIDIA Purple */
          foreground: "var(--color-primary-foreground)",
          light: "var(--color-purple-light)",
          dark: "var(--color-purple-dark)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)", /* RFIDIA Coral */
          foreground: "var(--color-secondary-foreground)",
          light: "var(--color-coral-light)",
        },
        destructive: {
          DEFAULT: "var(--color-destructive)",
          foreground: "var(--color-destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-accent)", /* RFIDIA Turquoise */
          foreground: "var(--color-accent-foreground)",
          light: "var(--color-turquoise-light)",
        },
        popover: {
          DEFAULT: "var(--color-popover)",
          foreground: "var(--color-popover-foreground)",
        },
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          foreground: "var(--color-success-foreground)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          foreground: "var(--color-warning-foreground)",
        },
        error: {
          DEFAULT: "var(--color-error)",
          foreground: "var(--color-error-foreground)",
        },
        rfidia: {
          purple: "var(--color-primary)",
          coral: "var(--color-secondary)",
          turquoise: "var(--color-accent)",
          'purple-light': "var(--color-purple-light)",
          'purple-dark': "var(--color-purple-dark)",
          'coral-light': "var(--color-coral-light)",
          'turquoise-light': "var(--color-turquoise-light)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          light: "var(--color-text-light)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: ['Inter Display', 'sans-serif'],
        body: ['Source Sans 3', 'sans-serif'],
        cta: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
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
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-from-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "gradient-flow": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.3s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
        "gradient-flow": "gradient-flow 8s ease infinite",
      },
      boxShadow: {
        'elevated': '0 4px 20px rgba(107, 76, 154, 0.12)',
        'prominent': '0 8px 40px rgba(107, 76, 154, 0.18)',
        'depth-layered': '0 2px 8px rgba(107, 76, 154, 0.08), 0 4px 16px rgba(107, 76, 154, 0.06), 0 8px 32px rgba(107, 76, 154, 0.04)',
        'rfidia': '0 4px 24px rgba(107, 76, 154, 0.15), 0 2px 12px rgba(232, 93, 117, 0.1)',
      },
    },
  },
  plugins: [],
}