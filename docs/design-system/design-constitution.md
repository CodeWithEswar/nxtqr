# NXTQR — Strict UI/UX Design Constitution

## Pure Monochrome · Solid Neumorphism · Developer-Crafted Interface

---

## 1. Pure Monochrome Foundation

The default appearance of NXTQR is built on an absolute pure black foundation:

| Token                           | Dark Theme | Light Theme |
| :------------------------------ | :--------- | :---------- |
| **Background (Level 0)**        | `#000000`  | `#FFFFFF`   |
| **Foreground**                  | `#FFFFFF`  | `#000000`   |
| **Surface (Level 1)**           | `#0A0A0A`  | `#F5F5F5`   |
| **Elevated Surface (Level 2)**  | `#141414`  | `#FFFFFF`   |
| **Secondary Surface (Level 3)** | `#1A1A1A`  | `#EBEBEB`   |
| **Border**                      | `#262626`  | `#E5E5E5`   |
| **Subtle Border**               | `#1C1C1C`  | `#F0F0F0`   |
| **Muted Text**                  | `#A3A3A3`  | `#737373`   |
| **Disabled Text**               | `#737373`  | `#A3A3A3`   |
| **Default Accent**              | `#FFFFFF`  | `#000000`   |

- True black (`#000000`) is mandatory for the main application and canvas background.
- Gradients, decorative navy, charcoal-blue, or purple tinted backgrounds are strictly prohibited.

---

## 2. Solid Neumorphism (Restrained Tactile Depth)

NXTQR employs restrained solid neumorphism to communicate tactile depth without blurry or soft decorative artifacts:

### Level 0 — Base

- Pure black background (`#000000`).
- Used for main canvas, full-page viewports, and application layout base.

### Level 1 — Raised

- Solid surface (`#0A0A0A`) with subtle border (`#262626`) and directional shadow:
  `box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.5), 0 1px 0 0 rgba(255, 255, 255, 0.03) inset;`
- Used for buttons, toolbars, interactive controls, compact cards.

### Level 2 — Elevated

- Stronger elevation on `#141414`:
  `box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.7), 0 1px 0 0 rgba(255, 255, 255, 0.05) inset;`
- Used for popovers, dropdown menus, dialogs, floating inspectors.

### Level 3 — Pressed

- Inset tactile treatment on `#1A1A1A`:
  `box-shadow: inset 0 1px 3px 0 rgba(0, 0, 0, 0.6), inset 0 0 1px 0 rgba(0, 0, 0, 0.4);`
- Used for active toolbar buttons, selected segmented controls, pressed states.

**Prohibited:** Glassmorphism, backdrop blur, transparent floating cards, excessive glow, large diffuse shadows.

---

## 3. Pure Accent Color System

Users choose their own accent color. Presets use clean, saturated pure tones:

| Accent Preset   | HEX       | Accessible Text Color |
| :-------------- | :-------- | :-------------------- |
| **Monochrome**  | `#FFFFFF` | `#000000` (Black)     |
| **Pure Red**    | `#FF0000` | `#FFFFFF` (White)     |
| **Pure Orange** | `#FF6600` | `#000000` (Black)     |
| **Pure Yellow** | `#FFD600` | `#000000` (Black)     |
| **Pure Green**  | `#00CC66` | `#000000` (Black)     |
| **Pure Blue**   | `#0066FF` | `#FFFFFF` (White)     |
| **Pure Violet** | `#8000FF` | `#FFFFFF` (White)     |
| **Pure Pink**   | `#FF0099` | `#FFFFFF` (White)     |

- Text contrast on accent surfaces is dynamically calculated via relative luminance math (threshold: 0.30).
- Accent colors are strictly for primary emphasis (primary actions, active tabs, selected graph nodes, focus rings). The majority of the interface remains monochrome.

---

## 4. Global Border Radius Standard: `rounded-md`

- Every rectangular control and card **must use `rounded-md`** (`0.375rem / 6px`).
- Do not randomly mix `rounded-sm`, `rounded-lg`, `rounded-xl`, or `rounded-2xl`.
- Circular exceptions (`rounded-full`) are strictly permitted only for avatars, radio selectors, and loading spinners.

---

## 5. UI Hygiene Standards

1. **No Decorative Badges:**
   - Badges are permitted strictly for status, environment, version, severity, permission, or meaningful counts.
   - Never use badges for card titles, section headings, or redundant labels.
2. **No Duplicate Actions:**
   - One clearly identifiable primary action where appropriate.
   - No duplicate "Create", "Save", or "Refresh" buttons within the same view.
3. **Hugeicons Exclusivity:**
   - Standard 1.5 stroke weight, 16px default dimensions.
   - Never mix Lucide, Heroicons, or raw SVGs.
