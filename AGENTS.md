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

---

## 3. Design System & Theming Rules

1. **Pure Black Monochrome Base**:
   - The default theme is pure black (`#000000`).
   - Surfaces use neutral dark grayscale (`#080808`, `#111111`, `#171717`).
   - Borders use `#262626` and `#1C1C1C`.
   - **Never** introduce dark blue, purple, or gradient AI dashboard backgrounds.
2. **User-Selected Accent**:
   - **Never hardcode accent colors** in React components (no fixed orange, red, blue, or purple).
   - Always reference semantic CSS classes: `bg-accent`, `text-accent`, `text-accent-foreground`, `border-accent`, `ring-accent`.
   - Contrast must always satisfy WCAG 2.1 AA/AAA. Foreground text on accent surfaces is automatically derived via `@nxtqr/design-system`.
3. **Global Border Radius Standard**:
   - Every rectangular control and card **must use `rounded-md`** (`--radius: 0.375rem / 6px`).
   - **Never** use `rounded-xl`, `rounded-2xl`, or `rounded-full` on rectangular surfaces.
   - Permitted circular exceptions: Avatars, Radio button indicators, Loading spinners (`rounded-full`).
4. **Iconography**:
   - Hugeicons is the primary iconography library.
   - Standard stroke width: `1.5`. Default size: `16px`.
   - **Never use emoji** as functional icons in UI controls.
   - **Never mix** Lucide, Heroicons, and Hugeicons.

---

## 4. UI Quality & Prohibited Patterns

### Prohibited Design Patterns:

- **No** random decorative gradients or glassmorphism blurs.
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
