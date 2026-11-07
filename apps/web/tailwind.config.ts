import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/design-system/src/**/*.{ts,tsx}",
  ],
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
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "elevated-surface": "var(--elevated-surface)",
        "secondary-surface": "var(--secondary-surface)",
        "muted-surface": "var(--muted-surface)",
        border: "var(--border)",
        "subtle-border": "var(--subtle-border)",
        "muted-foreground": "var(--muted-foreground)",
        "secondary-foreground": "var(--secondary-foreground)",
        "disabled-foreground": "var(--disabled-foreground)",
        ring: "var(--ring)",
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
          hover: "var(--accent-hover)",
          active: "var(--accent-active)",
          muted: "var(--accent-muted)",
          "muted-foreground": "var(--accent-muted-foreground)",
          ring: "var(--accent-ring)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
        },
      },
      boxShadow: {
        "level-0": "var(--shadow-level-0)",
        "level-1": "var(--shadow-level-1)",
        "level-2": "var(--shadow-level-2)",
        "level-3": "var(--shadow-level-3)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        md: "var(--radius)",
        sm: "calc(var(--radius) - 2px)",
        lg: "calc(var(--radius) + 2px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
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
  plugins: [tailwindcssAnimate],
};

export default config;
