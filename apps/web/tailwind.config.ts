import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
        // Sistema TuPatrimonio
        tp: {
          // Colores base
          primary: "var(--tp-buttons)",
          "primary-hover": "var(--tp-buttons-hover)",
          "bg-light": "var(--tp-background-light)",
          "bg-dark": "var(--tp-background-dark)",
          lines: "var(--tp-lines)",
          
          // Variaciones con opacidad - Background Light
          "bg-light-5": "var(--tp-bg-light-5)",
          "bg-light-10": "var(--tp-bg-light-10)",
          "bg-light-20": "var(--tp-bg-light-20)",
          "bg-light-30": "var(--tp-bg-light-30)",
          "bg-light-40": "var(--tp-bg-light-40)",
          "bg-light-50": "var(--tp-bg-light-50)",
          "bg-light-60": "var(--tp-bg-light-60)",
          "bg-light-80": "var(--tp-bg-light-80)",
          
          // Variaciones con opacidad - Background Dark
          "bg-dark-5": "var(--tp-bg-dark-5)",
          "bg-dark-10": "var(--tp-bg-dark-10)",
          "bg-dark-20": "var(--tp-bg-dark-20)",
          "bg-dark-30": "var(--tp-bg-dark-30)",
          "bg-dark-40": "var(--tp-bg-dark-40)",
          "bg-dark-50": "var(--tp-bg-dark-50)",
          
          // Variaciones de líneas/gray
          "lines-10": "var(--tp-lines-10)",
          "lines-20": "var(--tp-lines-20)",
          "lines-30": "var(--tp-lines-30)",
          "lines-50": "var(--tp-lines-50)",
          
          // Variaciones de botones/primary
          "primary-5": "var(--tp-buttons-5)",
          "primary-10": "var(--tp-buttons-10)",
          "primary-20": "var(--tp-buttons-20)",
          "primary-30": "var(--tp-buttons-30)",
          
          // Colores adicionales
          white: "var(--tp-white)",
          "white-80": "var(--tp-white-80)",
          "white-60": "var(--tp-white-60)",
          "white-50": "var(--tp-white-50)",
          "white-40": "var(--tp-white-40)",
          
          // Grises del sistema
          "gray-50": "var(--tp-gray-50)",
          "gray-100": "var(--tp-gray-100)",
          "gray-200": "var(--tp-gray-200)",
          "gray-600": "var(--tp-gray-600)",
          "gray-700": "var(--tp-gray-700)",
          "gray-900": "var(--tp-gray-900)",
          
          // Estados
          success: "var(--tp-success)",
          "success-light": "var(--tp-success-light)",
          "success-border": "var(--tp-success-border)",
          error: "var(--tp-error)",
          "error-light": "var(--tp-error-light)",
          "error-border": "var(--tp-error-border)",
          warning: "var(--tp-warning)",
          info: "var(--tp-info)",
        },
        
        // Shadcn/ui default colors
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
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
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
      },
      backgroundImage: {
        // Gradientes TuPatrimonio
        "tp-gradient-primary": "var(--tp-gradient-primary)",
        "tp-gradient-background": "var(--tp-gradient-background)",
        "tp-gradient-background-dark": "var(--tp-gradient-background-dark)",
        "tp-gradient-subtle": "var(--tp-gradient-subtle)",
      },
      boxShadow: {
        // Shadows TuPatrimonio
        "tp-sm": "var(--tp-shadow-sm)",
        "tp-md": "var(--tp-shadow-md)",
        "tp-lg": "var(--tp-shadow-lg)",
        "tp-xl": "var(--tp-shadow-xl)",
        "tp-2xl": "var(--tp-shadow-2xl)",
      },
      backdropBlur: {
        // Backdrop blur TuPatrimonio
        "tp-sm": "4px",
        "tp-md": "8px", 
        "tp-lg": "16px",
      },
      borderRadius: {
        // Radius TuPatrimonio
        "tp-sm": "var(--tp-radius-sm)",
        "tp-md": "var(--tp-radius-md)",
        "tp-lg": "var(--tp-radius-lg)",
        "tp-xl": "var(--tp-radius-xl)",
        "tp-2xl": "var(--tp-radius-2xl)",
        
        // Shadcn defaults
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        outfit: ["var(--font-outfit)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
