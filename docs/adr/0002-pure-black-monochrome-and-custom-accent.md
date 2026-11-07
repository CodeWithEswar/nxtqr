# ADR 0002: Pure Black Monochrome Base with User-Selected Accent

## Status

Accepted

## Context

Previous prototypes utilized fixed copper-orange branding. User requirements and developer product standards demand a pure black, high-contrast, professional monochrome interface with customizable user accents.

## Decision

- Replace the fixed copper-orange accent with a pure black (`#000000`) dark theme foundation.
- Accent color is no longer hardcoded: users choose from calibrated presets or custom HEX values.
- WCAG 2.1 relative luminance math dynamically calculates accessible text colors (`#000000` or `#FAFAFA`).
- Theme changes apply immediately via CSS variables on `document.documentElement` without page reloading.

## Consequences

- Components must never hardcode accent colors; they must use `bg-accent`, `text-accent`, `ring-accent`.
- Semantic colors (destructive, warning, success) remain independent of the user's accent.
