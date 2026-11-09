# NXTQR — Strict UI/UX Design Constitution

## Pure Monochrome · Solid Neumorphism · Developer-Crafted Interface

---

## 1. Unified Pure Monochrome Standard

NXTQR implements exactly **one application theme**: Pure Black Monochrome.
There are no light/dark toggles, no system theme listeners, no theme switchers, no accent color pickers, and no multicolor presets.

| Token | Hex Value | CSS Variable | Architectural Role | Contrast vs #000 |
| :--- | :--- | :--- | :--- | :--- |
| **Background (Level 0)** | `#000000` | `--background` | Full canvas viewport and full-page layout base | 1.0:1 |
| **Foreground** | `#FFFFFF` | `--foreground` | Primary text, titles, high-contrast symbols | 21.0:1 (AAA) |
| **Surface 01 (Level 1)** | `#080808` | `--surface-01` | Subtle raised surfaces, bottom toolbars, rail containers | 1.06:1 |
| **Surface 02** | `#0D0D0D` | `--surface-02` | Primary cards, panels, tab stages, inspector bodies | 1.13:1 |
| **Surface 03 (Level 2)** | `#141414` | `--surface-03` | Floating dialogs, popovers, inspectors, context menus | 1.23:1 |
| **Surface 04 (Level 3)** | `#1A1A1A` | `--surface-04` | Active tabs, pressed states, hover feedback, inset wells | 1.34:1 |
| **Border Subtle** | `#202020` | `--border-subtle` | Structural separation, internal table lines, subtle grids | 1.47:1 |
| **Border Default** | `#292929` | `--border` | Standard card boundaries, input frames, component borders | 1.65:1 |
| **Border Strong** | `#404040` | `--border-strong` | Emphasized boundaries, active focus rings, selection frames | 2.16:1 |
| **Text Secondary** | `#B5B5B5` | `--secondary-foreground` | Secondary descriptors, subtitle copy, table cells | 12.7:1 (AAA) |
| **Text Muted** | `#858585` | `--muted-foreground` | Supporting metadata, timestamps, keyboard hints | 7.15:1 (AAA) |
| **Text Disabled** | `#666666` | `--disabled-foreground` | Inactive elements, disabled buttons, placeholder text | 4.54:1 (AA) |

- True black (`#000000`) is mandatory for the main application and canvas background.
- Gradients, decorative navy, charcoal-blue, or purple tinted backgrounds are strictly prohibited.

---

## 2. Solid Neumorphism (Restrained Tactile Depth)

NXTQR employs restrained solid neumorphism to communicate tactile depth without blurry or soft decorative artifacts:

### Level 0 — Base
- Pure black background (`#000000`).
- Used for main canvas, full-page viewports, and application layout base.

### Level 1 — Raised
- Solid surface (`#080808` / `#0D0D0D`) with subtle border (`#202020` / `#292929`) and directional shadow:
  `box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.5), 0 1px 0 0 rgba(255, 255, 255, 0.03) inset;`
- Used for buttons, toolbars, interactive controls, compact cards.

### Level 2 — Elevated
- Stronger elevation on `#141414`:
  `box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.7), 0 1px 0 0 rgba(255, 255, 255, 0.05) inset;`
- Used for popovers, dropdown menus, dialogs, floating inspectors.

### Level 3 — Pressed / Inset
- Inset tactile treatment on `#1A1A1A`:
  `box-shadow: inset 0 1px 3px 0 rgba(0, 0, 0, 0.6), inset 0 0 1px 0 rgba(0, 0, 0, 0.4);`
- Used for active toolbar buttons, selected segmented controls, inputs, and pressed states.

**Prohibited:** Glassmorphism, backdrop blur, transparent floating cards, excessive glow, large diffuse shadows.

---

## 3. Strict Elimination of Decorative Accents

- Primary interaction emphasis must use pure white (`#FFFFFF`) or high-contrast neutral gray (`#1A1A1A`).
- Red accent buttons, blue active navigation, violet highlights, orange CTAs, green selected tabs, and multicolor presets are strictly prohibited.
- Narrow functional status exceptions (pass/fail, execution status) use semantic status tokens with accompanying Hugeicons and text labels, never as decorative themes.

---

## 4. Global Border Radius Standard

- Every rectangular control and card **must use `rounded-md`** (`--radius: 0.375rem / 6px`).
- **Never** use `rounded-sm`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, or `rounded-full` on rectangular surfaces.
- Permitted circular exceptions: Avatars, Radio button indicators, Loading spinners (`rounded-full`).

---

## 5. Iconography

- Hugeicons is the primary iconography library. Standard stroke width: `1.5`. Default size: `16px`.
- **Never use emoji** as functional icons in UI controls.
- **Never mix** Lucide, Heroicons, and Hugeicons.
