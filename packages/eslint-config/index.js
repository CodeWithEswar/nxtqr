module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      { "prefer": "type-imports", "fixStyle": "separate-type-imports" }
    ],
    "@typescript-eslint/no-explicit-any": "warn"
  },
  env: {
    node: true,
    es2022: true
  },
  ignorePatterns: ["node_modules/", "dist/", ".turbo/", ".next/"]
};

