# NXTQR — Monochrome System Architecture

## Architecture

NXTQR implements a unified, immutable **Pure Black Monochrome** standard. The previous dynamic theme switcher and accent preset engine are permanently decommissioned.

```
+--------------------------------------------------------------------+
|                         NXTQR STUDIO SHELL                         |
|                                                                    |
|  Theme: Pure Black Monochrome (#000000)                            |
|  Material: Solid Neumorphism (L0 Base -> L3 Inset)                 |
|  Radius: rounded-md (0.375rem / 6px)                               |
|  Typography: Geist Sans (UI) & Geist Mono (Code/Metrics)           |
+--------------------------------------------------------------------+
```

## Immutable Monochrome Tokens

The color tokens are statically defined in `@nxtqr/design-system` and injected via `:root` in `globals.css`:

```css
:root {
  color-scheme: dark;
  --background: #000000;
  --foreground: #ffffff;
  --card: #0d0d0d;
  --card-foreground: #ffffff;
  --popover: #141414;
  --popover-foreground: #ffffff;
  --primary: #ffffff;
  --primary-foreground: #000000;
  --secondary: #141414;
  --secondary-foreground: #ffffff;
  --muted: #141414;
  --muted-foreground: #858585;
  --accent: #1a1a1a;
  --accent-foreground: #ffffff;
  --border: #292929;
  --input: #292929;
  --ring: #e5e5e5;
  --radius: 0.375rem;
}
```

## Prohibited Features

The following features must never be reintroduced:
- Theme mode switchers (Light, Dark, System)
- Accent color pickers
- Saturated color presets (Pure Red, Pure Orange, Pure Blue, etc.)
- Custom HEX inputs
- Client-side theme switching listeners
- Per-workspace theme persistence
