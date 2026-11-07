# NXTQR — Interactive Visual Engineering Studio

NXTQR is a multi-visualizer engineering platform built with TypeScript, pnpm, Turborepo, Next.js App Router, and Cloudflare Workers.

---

## Architecture Principles

- **Unified Platform**: One primary Next.js application (`apps/web`) with isolated feature modules for visualizers and shared platform packages (`packages/*`).
- **Pure Black Monochrome Theme**: Developer-grade pure black (`#000000`) background, neutral grayscale hierarchy, and dynamic user-customizable accent color with WCAG 2.1 perceptual contrast calculations.
- **Consistent Radius**: Strict `rounded-md` standard (`--radius: 0.375rem`) across buttons, inputs, dialogs, cards, and canvas nodes.
- **Iconography**: Standardized Hugeicons integration with 1.5 stroke weights and accessible semantics.
- **Security & Authorization**: Row Level Security (RLS) on all Supabase PostgreSQL tables, Zod runtime validation, and server-side authorization boundaries.

---

## Monorepo Layout

```
nxtqr/
├── apps/
│   ├── web/                     # Next.js App Router platform shell
│   └── docs/                    # Documentation application
├── packages/
│   ├── ui/                      # shadcn/ui components & composite patterns (rounded-md)
│   ├── design-system/           # Pure black tokens, theme engine, perceptual contrast
│   ├── icons/                   # Hugeicons centralized integration
│   ├── shared-types/            # Shared TypeScript domain & platform interfaces
│   ├── validation/              # Source-of-truth Zod validation schemas
│   ├── database/                # Supabase SSR clients & PostgreSQL schema types
│   ├── auth/                    # Server session helpers & permission checks
│   ├── query/                   # TanStack Query v5 setup & query key factories
│   ├── state/                   # Zustand reactive client interaction stores
│   ├── canvas-core/             # Coordinate math, viewport conversion, zoom limits
│   ├── graph-schema/            # Versioned graph document schemas & migrations
│   ├── node-registry/           # Visualizer node definition registry
│   ├── simulation-core/         # Simulation state machine & event bus
│   ├── execution-trace/         # Execution timeline models & scrubber types
│   ├── analytics/               # Typed privacy-safe telemetry events
│   ├── security/                # XSS sanitization, size guards, rate limiters, masking
│   ├── observability/           # Structured JSON logger & correlation IDs
│   ├── performance/             # Frame budgets & performance profilers
│   ├── utils/                   # cn(), formatting, assertions
│   ├── eslint-config/           # Shared ESLint configuration
│   └── typescript-config/       # Base tsconfig presets
├── workers/
│   ├── api/                     # Cloudflare Edge API Worker
│   ├── dispatcher/              # Cloudflare Queue consumer & dispatcher
│   ├── simulation/              # Simulation runner & R2 export worker
│   ├── notifications/           # Notification dispatch worker
│   └── analytics/               # Batch telemetry worker
├── supabase/
│   ├── migrations/              # Initial relational schema & RLS policies
│   ├── seed.sql                 # Safe local development seeds
│   └── tests/                   # SQL RLS isolation test suite
└── tests/
    └── e2e/                     # Playwright end-to-end test suite
```

---

## Getting Started

### 1. Prerequisites

- **Node.js**: `>= 20.0.0` (LTS recommended)
- **pnpm**: `>= 9.0.0` (`pnpm@12.4.1` specified)
- **Supabase CLI** (optional for local database execution: `brew install supabase/tap/supabase` or `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git`)

### 2. Installation

```bash
pnpm install
```

### 3. Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the internal foundation verification shell.

### 4. Quality Checks

```bash
pnpm format:check   # Prettier format verification
pnpm typecheck      # Monorepo TypeScript diagnostic check
pnpm test:unit      # Vitest unit test suite
pnpm build          # Turborepo production build
```

---

## Theme & Accent System

The NXTQR theme engine allows users to select custom accent colors while keeping the pure black monochrome base:

- **Presets**: Monochrome (`#FAFAFA`), Red (`#E5484D`), Orange (`#F28C52`), Amber (`#E9AD46`), Green (`#48B98A`), Blue (`#579DFF`), Violet (`#A78BFA`), Pink (`#E879B9`).
- **Custom HEX**: Enter any valid 3-char or 6-char hex color.
- **Zero-Reload**: Changes apply synchronously to CSS variables on `document.documentElement` without page reloading.
- **Accessibility**: Automatic foreground selection (`#000000` or `#FAFAFA`) based on WCAG 2.1 relative luminance math to ensure readable contrast.

---

## Phase 01 Scope Notice

In accordance with Phase 01 specifications:

- **No** public marketing landing page has been created (deferred until application completion).
- **No** future visualizer functionality or mock dashboards are prematurely built.
- All 18 platform packages, Supabase migrations, Cloudflare worker definitions, shadcn/ui components, and unit test suites are fully functional.
