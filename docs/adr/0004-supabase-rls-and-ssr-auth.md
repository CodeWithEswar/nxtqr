# ADR 0004: PostgreSQL RLS and Supabase SSR Authentication

## Status

Accepted

## Context

Multi-tenant security requires that workspace data isolation cannot be bypassed through application layer proxy bugs or missing WHERE clauses.

## Decision

- Use Supabase PostgreSQL with `@supabase/ssr` for session management.
- Enable PostgreSQL Row Level Security (RLS) on all user-accessible tables.
- Cross-tenant checks are enforced at the database kernel level using `is_workspace_member(ws_id)` security functions.

## Consequences

- All schema modifications must be done via SQL migrations in `supabase/migrations/`.
- Local verification tests must execute `supabase/tests/rls_test.sql`.
