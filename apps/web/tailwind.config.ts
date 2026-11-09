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
        surface: {
          DEFAULT: "var(--surface)",
          "00": "var(--surface-00)",
          "01": "var(--surface-01)",
          "02": "var(--surface-02)",
          "03": "var(--surface-03)",
          "04": "var(--surface-04)",
          "05": "var(--surface-05)",
        },
        "surface-00": "var(--surface-00)",
        "surface-01": "var(--surface-01)",
        "surface-02": "var(--surface-02)",
        "surface-03": "var(--surface-03)",
        "surface-04": "var(--surface-04)",
        "surface-05": "var(--surface-05)",
        "elevated-surface": "var(--elevated-surface)",
        "secondary-surface": "var(--secondary-surface)",
        "muted-surface": "var(--muted-surface)",
        border: {
          DEFAULT: "var(--border)",
          subtle: "var(--border-subtle)",
          default: "var(--border-default)",
          hover: "var(--border-hover)",
          strong: "var(--border-strong)",
          inset: "var(--border-inset)",
        },
        "border-subtle": "var(--border-subtle)",
        "border-default": "var(--border-default)",
        "border-hover": "var(--border-hover)",
        "border-strong": "var(--border-strong)",
        "border-inset": "var(--border-inset)",
        "subtle-border": "var(--subtle-border)",
        "muted-border": "var(--border-subtle)",
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
      transitionDuration: {
        "80": "80ms",
        "140": "140ms",
        "200": "200ms",
        "280": "280ms",
        "340": "340ms",
        "420": "420ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        enter: "cubic-bezier(0, 0, 0.2, 1)",
        exit: "cubic-bezier(0.4, 0, 1, 1)",
        emphasized: "cubic-bezier(0.2, 0, 0, 1)",
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
        "dialog-in": {
          from: {
            opacity: "0",
            transform: "translate(-50%, -50%) scale(0.985) translateY(8px)",
          },
          to: {
            opacity: "1",
            transform: "translate(-50%, -50%) scale(1) translateY(0)",
          },
        },
        "dialog-out": {
          from: {
            opacity: "1",
            transform: "translate(-50%, -50%) scale(1) translateY(0)",
          },
          to: {
            opacity: "0",
            transform: "translate(-50%, -50%) scale(0.99) translateY(4px)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 200ms cubic-bezier(0, 0, 0.2, 1)",
        "accordion-up": "accordion-up 200ms cubic-bezier(0.4, 0, 1, 1)",
        "dialog-in": "dialog-in 200ms cubic-bezier(0, 0, 0.2, 1)",
        "dialog-out": "dialog-out 140ms cubic-bezier(0.4, 0, 1, 1)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
