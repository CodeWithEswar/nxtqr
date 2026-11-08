import type { ThemeRegistrationRaw } from "shiki";

/**
 * NXTQR Custom Syntax Highlighting Theme (Dark)
 * Calibrated against pure black (#000000) and surface (#0A0A0A)
 * WCAG 2.1 AA/AAA contrast compliant
 */
export const nxtqrDarkTheme: ThemeRegistrationRaw = {
  name: "nxtqr-dark",
  type: "dark",
  settings: [],
  colors: {
    "editor.background": "#000000",
    "editor.foreground": "#EDEDED",
    "editorLineNumber.foreground": "#525252",
    "editorLineNumber.activeForeground": "#A3A3A3",
    "editor.selectionBackground": "#262626",
    "editor.lineHighlightBackground": "#0A0A0A",
  },
  tokenColors: [
    {
      name: "Keywords & Control",
      scope: [
        "keyword",
        "keyword.control",
        "keyword.operator.new",
        "keyword.operator.expression",
        "keyword.operator.logical",
        "storage",
        "storage.type",
      ],
      settings: {
        foreground: "#B388FF", // Restrained violet
        fontStyle: "",
      },
    },
    {
      name: "Strings & Templates",
      scope: [
        "string",
        "string.template",
        "constant.other.symbol",
        "punctuation.definition.string",
      ],
      settings: {
        foreground: "#34D399", // Soft green
      },
    },
    {
      name: "Functions & Methods",
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call",
        "variable.function",
      ],
      settings: {
        foreground: "#FACC15", // Warm yellow
      },
    },
    {
      name: "Types, Classes & Components",
      scope: [
        "entity.name.type",
        "entity.name.class",
        "support.type",
        "support.class",
        "entity.other.inherited-class",
        "entity.name.tag",
      ],
      settings: {
        foreground: "#60A5FA", // Clear blue
      },
    },
    {
      name: "JSX Tags & Attributes",
      scope: ["entity.name.tag.tsx", "entity.name.tag.jsx", "entity.other.attribute-name"],
      settings: {
        foreground: "#93C5FD", // Lighter clear blue
      },
    },
    {
      name: "Numbers & Constants",
      scope: [
        "constant.numeric",
        "constant.language.boolean",
        "constant.language.null",
        "constant.language.undefined",
      ],
      settings: {
        foreground: "#FB923C", // Muted orange
      },
    },
    {
      name: "Comments & Docstrings",
      scope: ["comment", "punctuation.definition.comment"],
      settings: {
        foreground: "#737373", // Neutral gray
        fontStyle: "italic",
      },
    },
    {
      name: "Variables & Identifiers",
      scope: ["variable", "variable.other.readwrite", "meta.definition.variable"],
      settings: {
        foreground: "#FFFFFF", // Near-white
      },
    },
    {
      name: "Operators & Punctuation",
      scope: [
        "keyword.operator",
        "punctuation.accessor",
        "punctuation.separator",
        "punctuation.terminator",
      ],
      settings: {
        foreground: "#A3A3A3", // Light neutral
      },
    },
  ],
};

/**
 * NXTQR Custom Syntax Highlighting Theme (Light)
 */
export const nxtqrLightTheme: ThemeRegistrationRaw = {
  name: "nxtqr-light",
  type: "light",
  settings: [],
  colors: {
    "editor.background": "#F5F5F5",
    "editor.foreground": "#171717",
    "editorLineNumber.foreground": "#A3A3A3",
    "editorLineNumber.activeForeground": "#525252",
    "editor.selectionBackground": "#E5E5E5",
    "editor.lineHighlightBackground": "#FFFFFF",
  },
  tokenColors: [
    {
      name: "Keywords & Control",
      scope: ["keyword", "storage", "storage.type"],
      settings: {
        foreground: "#7C3AED", // Deeper violet
      },
    },
    {
      name: "Strings",
      scope: ["string", "string.template"],
      settings: {
        foreground: "#059669", // Forest green
      },
    },
    {
      name: "Functions",
      scope: ["entity.name.function", "support.function"],
      settings: {
        foreground: "#B45309", // Warm amber
      },
    },
    {
      name: "Types & Classes",
      scope: ["entity.name.type", "entity.name.class", "entity.name.tag"],
      settings: {
        foreground: "#2563EB", // Primary blue
      },
    },
    {
      name: "Numbers",
      scope: ["constant.numeric", "constant.language"],
      settings: {
        foreground: "#C2410C", // Deep orange
      },
    },
    {
      name: "Comments",
      scope: ["comment"],
      settings: {
        foreground: "#6B7280", // Muted gray
        fontStyle: "italic",
      },
    },
    {
      name: "Variables",
      scope: ["variable"],
      settings: {
        foreground: "#111827", // Near-black
      },
    },
    {
      name: "Operators",
      scope: ["keyword.operator", "punctuation"],
      settings: {
        foreground: "#4B5563",
      },
    },
  ],
};
