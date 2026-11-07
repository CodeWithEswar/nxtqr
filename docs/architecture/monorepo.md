# Monorepo Architecture

## Workspace Orchestration

- **pnpm workspaces**: Strict dependency resolution, isolated node-linker, content-addressable store.
- **Turborepo**: Build task pipeline, topological sorting, output caching (`.turbo/`).

## Workspace Directories

- `apps/*`: Application entrypoints (`web`, `docs`).
- `packages/*`: Independent, reusable domain and infrastructure libraries (`@nxtqr/*`).
- `workers/*`: Serverless Cloudflare edge workers and queue dispatchers (`@nxtqr/worker-*`).
- `supabase/*`: Relational migrations, RLS policies, seeds, and SQL test suites.
- `tooling/*`: Monorepo scripts, generators, and benchmarks.
- `tests/*`: E2E (Playwright) and cross-package integration tests.
