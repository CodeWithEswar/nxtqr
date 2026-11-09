# AGENTS.MD — NXTQR Engineering Constitution & Agent Development Standards

This document establishes the mandatory architectural rules and coding standards for all AI coding agents (OpenAI Codex, Google Antigravity, and paired engineers) working within the NXTQR repository.

---

## 1. Core Architectural Principle

> **"One platform, multiple visualizers, shared engineering infrastructure."**

- **Do NOT** create separate Next.js applications for each visualizer.
- Use the unified `apps/web` application shell with domain-specific feature modules under `apps/web/src/features/visualizers/*`.
- Shared code, contracts, UI components, and state belong in `packages/*`.

---

## 2. Package Boundaries and Ownership

Strictly respect monorepo package boundaries:

| Package                | Responsibility                                          | Prohibited Content                            |
| ---------------------- | ------------------------------------------------------- | --------------------------------------------- |
| `@nxtqr/ui`            | Primitives & composite components (shadcn/ui based)     | Business logic, direct DB calls, API requests |
| `@nxtqr/design-system` | Tokens, color calculations, contrast math, typography   | React state management, DOM event listeners   |
| `@nxtqr/icons`         | Standardized Hugeicons wrappers & semantic icons        | Lucide icons, raw emoji, ad-hoc SVGs          |
| `@nxtqr/graph-schema`  | Discriminated union schemas for nodes, edges, docs      | React Flow internal instance types            |
| `@nxtqr/canvas-core`   | Coordinate conversions, zoom bounds, viewport math      | UI presentation logic                         |
| `@nxtqr/state`         | Zustand stores for client-only reactive UI state        | Server datasets, DB cache                     |
| `@nxtqr/database`      | Supabase clients, generated DB types, SSR helpers       | UI components                                 |
| `@nxtqr/security`      | Input sanitization, size guards, rate limiters, masking | Presentation logic                            |
| `@nxtqr/validation`    | Source-of-truth Zod validation schemas                  | Complex runtime side-effects                  |
| `@nxtqr/branding`      | Official brand vectors, AppLogo, AnimatedLogo, wordmark | Functional UI icons, domain logic, DB calls   |

---

## 3. Design System & Appearance Standard

1. **Unified Pure Black Monochrome**:
   - The studio has exactly **one visual identity**: Pure Black Monochrome.
   - Absolutely **no** light mode, dark mode toggle, system theme listener, theme switcher, accent color picker, multicolor presets, or custom HEX inputs.
   - The default and only visual identity is monochrome:
     - Background: `#000000`
     - Foreground: `#FFFFFF`
     - Surface 01: `#080808`
     - Surface 02: `#0D0D0D`
     - Surface 03: `#141414`
     - Surface 04: `#1A1A1A`
     - Border subtle (`--border-subtle`): `#1A1A1A` (Minimal separation)
     - Border inset (`--border-inset`): `#202020` (Inset neumorphic surfaces)
     - Border default (`--border-default`): `#262626` (Standard component boundaries)
     - Border hover (`--border-hover`): `#333333` (Hover feedback)
     - Border strong (`--border-strong`): `#404040` (Emphasized boundaries)
     - Text secondary: `#B5B5B5`
     - Text muted: `#858585`
     - Text disabled: `#666666`
   - **Never** introduce dark blue, purple, or gradient AI dashboard backgrounds.
   - **STRICT BORDER RULE — ZERO WHITE BORDERS**:
     - **Never use white, near-white, or bright-gray borders (`#FFFFFF`, `#F5F5F5`, `#E5E5E5`, `border-white`, `border-foreground`, `outline-white`, `ring-white`) for component outlines, including hover, active, selected, and focus states.**
     - White is strictly reserved for typography and intentional solid button fills—NEVER for component borders.
     - For active, selected, and hover states, use slightly brighter solid surfaces (`bg-surface-04`), dark-gray borders (`#333333` / `#404040`), bold foreground typography, and pressed neumorphic depth (`shadow-level-3`).
     - For graph nodes, use dark neutral boundaries (`#333333` / `#404040`) and non-color selection cues.
     - For keyboard focus indicators, use dark-gray focus rings (`#404040` / `#555555`) or surface contrast/inset indicators.
2. **Solid Neumorphism (Restrained Depth)**:
   - **Level 0 — Base**: `#000000` (main canvas and full-page background).
   - **Level 1 — Raised**: Solid surface with subtle border (`#202020`) and restrained directional shadow (`--shadow-level-1`). Used for buttons, toolbars, compact cards.
   - **Level 2 — Elevated**: Stronger elevation (`--shadow-level-2`). Used for popovers, dropdown menus, dialogs, floating inspectors.
   - **Level 3 — Pressed**: Inset treatment indicating active or pressed state (`--shadow-level-3`). Used for active toolbar buttons, selected controls, inputs.
   - **No glassmorphism, no backdrop blur**, and no transparent floating cards.
3. **No Decorative Accent Colors**:
   - Red accent buttons, blue active links, violet highlights, orange CTAs, green selected tabs, multicolor backgrounds, rainbow gradients, and neon glows are strictly **prohibited**.
   - Primary interaction emphasis must use pure white (`#FFFFFF`), near-white, or neutral grayscale (`#1A1A1A`).
   - Narrow functional status exceptions (e.g. simulation execution pass/fail) use restrained semantic tokens (`--destructive`, `--success`, `--warning`) alongside explicit text labels and Hugeicons, never as general UI decoration.
4. **Global Border Radius Standard**:
   - Every rectangular control and card **must use `rounded-md`** (`--radius: 0.375rem / 6px`).
   - **Never** use `rounded-sm`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, or `rounded-full` on rectangular surfaces.
   - Permitted circular exceptions: Avatars, Radio button indicators, Loading spinners (`rounded-full`).
5. **Iconography**:
   - Hugeicons is the primary iconography library.
   - Standard stroke width: `1.5`. Default size: `16px`.
   - **Never use emoji** as functional icons in UI controls.
   - **Never mix** Lucide, Heroicons, and Hugeicons.

---

## 4. UI Quality & Prohibited Patterns

### Prohibited Design Patterns:

- **No** white or near-white component borders, outlines, or rings (`#FFFFFF`, `#F5F5F5`, `#E5E5E5`, `border-white`, `border-foreground`, `outline-white`, `ring-white`). All boundaries must use approved dark-gray tokens (`#1A1A1A` to `#404040`).
- **No** random decorative gradients or glassmorphism blurs.
- **No** decorative badges (badges permitted _only_ for meaningful status, version, severity, permission, or counts).
- **No** duplicate action buttons (e.g. repeated "Create Project" or redundant Save/Refresh in the same view).
- **No** generic 3-card SaaS dashboard mockups.
- **No** decorative charts with fake telemetry.
- **No** floating blobs, particle effects, or continuous decorative keyframe loops.
- **No** duplicate UI primitives (always import from `@nxtqr/ui`).

### Required Design Characteristics:

- High information density with restrained, intentional spacing.
- Compact typography: Geist Sans for UI, Geist Mono for code, metrics, and logs.
- Strict responsive behavior: Sheet/Drawer for mobile inspectors, container queries for resizable panes.
- Full keyboard accessibility and visible focus rings (`focus-visible:ring-1 focus-visible:ring-ring`).

---

## 5. Security & Authorization

- **Never** trust client-provided workspace IDs or user IDs without verifying membership.
- **Row Level Security (RLS)** is enabled on all PostgreSQL tables. Helper functions use `SECURITY DEFINER SET search_path = public`.
- **Never** expose service-role or secret keys to client bundles or browser environments.
- Validate all incoming payloads using Zod schemas from `@nxtqr/validation`.
- Assert payload size limits (`assertPayloadSize`) before parsing graph files or simulation traces.
- Mask all sensitive tokens, passwords, and API keys before logging (`maskSensitiveData`).

---

## 6. Performance Engineering

- Platform dependencies (`@xyflow/react`, `recharts`, `d3`, `elkjs`, `@monaco-editor/react`) must **never be eagerly bundled into the initial shell**.
- Use dynamic imports (`next/dynamic` or `React.lazy`) at the visualizer boundary.
- Initial JS bundle budget: `< 150KB` gzip initial shell.
- Use selective Zustand subscriptions (`useStore(state => state.specificField)`) to prevent unnecessary canvas re-renders.

---

## 7. Testing & Verification

- **Never claim a test passed without running it**.
- Unit tests (`vitest run`) must pass with zero errors.
- TypeScript checks (`tsc --noEmit`) must report zero diagnostics across all workspaces.
- All schema migrations must be reproducible and tested via `supabase/tests/rls_test.sql`.

---

## 8. Brand Identity & Vector Geometry Standards

- **Interactive Visual Engineering Studio**: NXTQR is an engineering studio, NOT a QR-code generator. QR codes, finder patterns, and QR terminology are strictly prohibited.
- **Brand Assets**: Always import official logos and wordmarks from `@nxtqr/branding` (`AppLogo`, `LogoMark`, `LogoWordmark`, `AnimatedLogo`).
- **Typography Fallback**: The wordmark uses Geist Sans with tracking `-0.04em` and strict system fallback chain (`Geist Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`).
- **Corner Brackets**: 4 symmetric corner brackets with `rounded-md` (6px) radius, stroke 3.5, and round joins.
- **Animated Logo**: Pure CSS/SVG keyframe animations; mandatory support for `prefers-reduced-motion: reduce`.
- **Review Gate**: Verify branding changes via `/verify/brand`.
