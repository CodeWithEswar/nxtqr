# ADR 0001: Adopt pnpm and Turborepo for Monorepo Architecture

## Status

Accepted

## Context

NXTQR requires a multi-package, multi-visualizer architecture sharing UI components, validation schemas, database clients, and simulation engines without publishing private packages to an external registry.

## Decision

We adopt **pnpm** as the package manager and **Turborepo** as the monorepo build orchestrator.

- pnpm provides efficient hard-linking and isolated dependency graphs preventing phantom dependencies.
- Turborepo coordinates builds, linting, typechecking, and tests with topological task caching.

## Consequences

- All developers and CI pipelines must use `pnpm`.
- Dependencies between internal packages are managed via `workspace:*`.
