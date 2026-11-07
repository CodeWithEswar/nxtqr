# NXTQR Precision Rail Scrollbar System

**Module:** Global Shared Scrollbar Infrastructure  
**Package Ownership:** `@nxtqr/design-system` & `@nxtqr/ui`  
**Governing Standard:** `AGENTS.md` (Sections 1, 3, 4, 6)  
**Live Review Gate:** `/verify/scrollbar`

---

## 1. Design Concept & Philosophy

The **NXTQR Precision Rail** is a custom scrollbar system designed to look and feel like a finely machined control track within a high-performance visual engineering studio.

### Key Characteristics

- **Minimal At Rest**: Unobtrusive pure monochrome track and thumb that integrate seamlessly into pure black `#000000` canvas and `#0A0A0A` surfaces.
- **Tactile Solid Neumorphism**: Inset track border (`#141414`), solid thumb (`#303030`), and a 1px specular top highlight (`rgba(255, 255, 255, 0.08)`) with zero blurry glassmorphism.
- **Dynamic Accent Interaction**: The thumb perimeter dynamically receives the user's selected accent color (`var(--accent)`) during active dragging, giving clear, tactile feedback without persistent visual noise.
- **Strict Geometry**: Follows the monorepo `rounded-md` standard (6px on default 10px rail, 4px on 7px compact/canvas rail, 3px on 6px dense rail).
- **CSS-Only Performance**: 100% hardware-accelerated CSS rules without JavaScript scroll listeners, ensuring 60+ FPS scrolling under high-density loads.

---

## 2. Design Tokens

The tokens are exported in TypeScript via `@nxtqr/design-system` (`scrollbarTokens`) and defined in CSS via `@nxtqr/design-system/styles/scrollbar.css`:

```css
:root {
  /* Dimensions */
  --scrollbar-size: 10px;
  --scrollbar-size-compact: 7px;
  --scrollbar-size-canvas: 7px;
  --scrollbar-size-dense: 6px;

  /* Corner Radii */
  --scrollbar-radius: var(--radius, 0.375rem); /* 6px */
  --scrollbar-radius-compact: 4px;
  --scrollbar-radius-dense: 3px;

  /* Dark Monochrome Palette (Default) */
  --scrollbar-track: #080808;
  --scrollbar-track-border: #141414;
  --scrollbar-thumb: #303030;
  --scrollbar-thumb-hover: #505050;
  --scrollbar-thumb-active: #666666;
  --scrollbar-border: #1f1f1f;
  --scrollbar-highlight: #626262;

  /* Dynamic Accent Integration */
  --scrollbar-accent: var(--accent, #ffffff);
}

.light {
  /* Light Palette Fallback */
  --scrollbar-track: #f5f5f5;
  --scrollbar-track-border: #e5e5e5;
  --scrollbar-thumb: #cccccc;
  --scrollbar-thumb-hover: #a3a3a3;
  --scrollbar-thumb-active: #737373;
  --scrollbar-border: #e0e0e0;
  --scrollbar-highlight: #ffffff;
}
```

---

## 3. Browser Engine Coverage

### 3.1 WebKit & Chromium

Customizes the standard pseudo-elements:

- `::-webkit-scrollbar`: Dimensions mapped to `--scrollbar-size`.
- `::-webkit-scrollbar-track`: Solid background with `inset 0 0 2px 0 rgba(0, 0, 0, 0.8)`.
- `::-webkit-scrollbar-thumb`: Solid surface with 1px border, specular top highlight, and 150ms transitions.
- `::-webkit-scrollbar-thumb:hover`: Elevated thumb color (`#505050`) and highlight border.
- `::-webkit-scrollbar-thumb:active`: Active thumb with `border-color: var(--scrollbar-accent)` and pressed inset shadow.
- `::-webkit-scrollbar-corner`: Transparent / track color match.

### 3.2 Standards-Based Firefox Fallback

Uses standard CSS Scrollbars Module Level 1:

- `scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);`
- `scrollbar-width: thin;` (or `none` for hidden)

---

## 4. Scrollbar Variants

| Variant           | Width / Height | Radius               | Target Context                                     | Behavior / Attributes                                                            |
| :---------------- | :------------- | :------------------- | :------------------------------------------------- | :------------------------------------------------------------------------------- |
| **Default**       | `10px`         | `6px` (`rounded-md`) | Document body, main content panels, large views    | `.scrollbar-default`, `[data-scrollbar="default"]`                               |
| **Compact**       | `7px`          | `4px`                | Sidebars, inspectors, file trees, nested menus     | `.scrollbar-compact`, `[data-scrollbar="compact"]`                               |
| **Canvas Panel**  | `7px`          | `4px`                | Node palettes, property inspectors over canvas     | `.scrollbar-canvas`, `[data-scrollbar="canvas"]`, `overscroll-behavior: contain` |
| **Data Dense**    | `6px`          | `3px`                | Tables, log streams, execution traces              | `.scrollbar-dense`, `[data-scrollbar="dense"]`                                   |
| **Hidden Visual** | `0px`          | `none`               | Clean technical regions with alternative scrolling | `.scrollbar-none`, `.no-scrollbar`, `[data-scrollbar="none"]`                    |

---

## 5. Component Integration

### 5.1 shadcn/ui `<ScrollArea />`

The Radix-based `<ScrollArea />` component in `@nxtqr/ui` supports the `variant` and `orientation` props:

```tsx
import { ScrollArea } from "@nxtqr/ui";

// Compact dual-axis scroll area
<ScrollArea variant="compact" orientation="both" className="h-64 w-full">
  <div className="w-[800px]">{content}</div>
</ScrollArea>

// Canvas-protected properties inspector
<ScrollArea variant="canvas" orientation="vertical" className="h-96">
  {inspectorControls}
</ScrollArea>
```

### 5.2 Native Overflow Containers

Native containers apply the Precision Rail via scoped CSS classes:

```tsx
// High-density log stream
<div className="h-48 overflow-y-auto scrollbar-dense bg-black p-3 font-mono text-xs">
  {logLines}
</div>

// Technical Data Table
<div className="overflow-x-auto scrollbar-dense">
  <table className="w-full text-xs">...</table>
</div>
```

---

## 6. Accessibility, Touch & Performance Guarantees

1. **Touch & Mobile**:
   `@media (hover: none) and (pointer: coarse)` preserves platform-native overlay scrollbar physics on iOS and Android. Desktop widths are not forced onto touch viewports.
2. **Keyboard Navigation**:
   Full arrow key, PageUp/PageDown, Home/End, and tab-focus navigation are preserved on all scrollable containers.
3. **Reduced Motion**:
   `@media (prefers-reduced-motion: reduce)` disables thumb transitions (`transition: none !important;`).
4. **Canvas Isolation**:
   The `canvas` variant enforces `overscroll-behavior: contain;` to ensure wheel scrolling at the top or bottom of a node inspector does not trigger zooming or panning on the underlying graph canvas.
5. **No Layout Shift**:
   Thumb hover and active states never alter the layout width or height of the scrollbar rail.
