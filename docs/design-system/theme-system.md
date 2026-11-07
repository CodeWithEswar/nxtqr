# Theme System & Perceptual Accent Engine

## Architecture

The theme engine is implemented in `@nxtqr/design-system` and consumed by `@nxtqr/state`.

```
User Action (Select pure preset or enter Hex)
  │
  ▼
Validation (Zod HexColorSchema)
  │
  ▼
Perceptual Math (RGB <-> HSL <-> Relative Luminance)
  │
  ▼
WCAG Contrast Derivation (Threshold: 0.30 -> #FFFFFF or #000000)
  │
  ▼
CSS Variable Generation (--accent, --accent-foreground, --ring)
  │
  ▼
Zero-Reload DOM Application (document.documentElement.style.setProperty)
  │
  ▼
Storage Sync (localStorage for anon, Supabase user_preferences for auth)
```

## Pure Saturated Accent Presets

| Preset ID    | Label       | Hex Code  | Accessible Text Color |
| :----------- | :---------- | :-------- | :-------------------- |
| `monochrome` | Monochrome  | `#FFFFFF` | `#000000`             |
| `red`        | Pure Red    | `#FF0000` | `#FFFFFF`             |
| `orange`     | Pure Orange | `#FF6600` | `#000000`             |
| `yellow`     | Pure Yellow | `#FFD600` | `#000000`             |
| `green`      | Pure Green  | `#00CC66` | `#000000`             |
| `blue`       | Pure Blue   | `#0066FF` | `#FFFFFF`             |
| `violet`     | Pure Violet | `#8000FF` | `#FFFFFF`             |
| `pink`       | Pure Pink   | `#FF0099` | `#FFFFFF`             |
