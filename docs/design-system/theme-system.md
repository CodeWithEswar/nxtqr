# Theme System & Perceptual Accent Engine

## Architecture

The theme engine is implemented in `@nxtqr/design-system` and consumed by `@nxtqr/state`.

```
User Action (Select preset or enter Hex)
  │
  ▼
Validation (Zod HexColorSchema)
  │
  ▼
Perceptual Math (RGB <-> HSL <-> Relative Luminance)
  │
  ▼
WCAG Contrast Check (getAccessibleForeground)
  │
  ▼
CSS Variable Generation (--accent, --accent-foreground, --ring)
  │
  ▼
Zero-Reload DOM Application (document.documentElement.style.setProperty)
  │
  ▼
Storage Sync (localStorage for anon, Supabase for auth user)
```

## Presets

| Preset ID    | Label      | Hex Code                             |
| ------------ | ---------- | ------------------------------------ |
| `monochrome` | Monochrome | `#FAFAFA` (dark) / `#18181B` (light) |
| `red`        | Red        | `#E5484D`                            |
| `orange`     | Orange     | `#F28C52`                            |
| `amber`      | Amber      | `#E9AD46`                            |
| `green`      | Green      | `#48B98A`                            |
| `blue`       | Blue       | `#579DFF`                            |
| `violet`     | Violet     | `#A78BFA`                            |
| `pink`       | Pink       | `#E879B9`                            |
