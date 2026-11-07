# Package Boundaries & Dependency Flow

## Dependency Direction

All dependencies flow inwards toward domain primitives and contracts. Circular dependencies between packages are strictly forbidden.

```
apps/web
  ├── @nxtqr/ui
  │     ├── @nxtqr/design-system
  │     ├── @nxtqr/icons
  │     └── @nxtqr/utils
  ├── @nxtqr/state
  │     ├── @nxtqr/design-system
  │     └── @nxtqr/shared-types
  ├── @nxtqr/query
  ├── @nxtqr/database
  │     └── @nxtqr/shared-types
  ├── @nxtqr/graph-schema
  │     └── @nxtqr/shared-types
  ├── @nxtqr/canvas-core
  └── @nxtqr/validation
```

## Package Responsibilities

1. `@nxtqr/ui`: Pure visual presentation primitives with `rounded-md` standard.
2. `@nxtqr/design-system`: Palette tokens, WCAG relative luminance math, contrast checking, CSS generator.
3. `@nxtqr/icons`: Hugeicons 1.5 stroke wrappers and accessible semantic icons.
4. `@nxtqr/shared-types`: Clean TypeScript interfaces across domain entities.
5. `@nxtqr/validation`: Zod schemas as the single source of runtime validation truth.
6. `@nxtqr/database`: Supabase browser & SSR server client factories with typed database schema.
7. `@nxtqr/auth`: Role-based access control (RBAC) helpers and session validators.
8. `@nxtqr/query`: TanStack QueryClient factory and standardized query key trees.
9. `@nxtqr/state`: Decoupled Zustand stores separating canvas high-frequency interaction from global layout.
10. `@nxtqr/graph-schema`: Versioned node, edge, and document schemas with migration runners.
11. `@nxtqr/canvas-core`: Viewport transformation math and coordinate conversions.
12. `@nxtqr/node-registry`: Extensible visualizer node type catalog.
13. `@nxtqr/simulation-core`: Simulation state machine and discrete event bus interfaces.
14. `@nxtqr/execution-trace`: Scrubber state and execution timeline frame models.
15. `@nxtqr/security`: Rate limiters, payload size guards, XSS sanitizers, and credential masking.
16. `@nxtqr/observability`: Structured JSON logger and distributed correlation IDs.
17. `@nxtqr/performance`: Frame budgets and execution duration measurement profilers.
18. `@nxtqr/utils`: Shared utilities (`cn`, formatting, invariant assertions).
