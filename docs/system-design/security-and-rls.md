# Security & Multi-Tenant RLS Architecture (Phase 05.4.25)

## Isolation & Authorization Controls
- **No Unauthenticated Access**: `POST /api/architecture/simulations/orchestrate` enforces `resolveAuthenticatedUser(request)` and returns HTTP `401` on missing credentials.
- **Test Header Lockdown**: `x-nxtqr-test-user` fallback in `apps/web/src/app/api/architecture/templates/_lib.ts` is strictly permitted only when `process.env.NODE_ENV === "test"` and Supabase env vars are absent.
- **Payload Guards**: Raw bodies are checked with `assertPayloadSize(rawBody, 512 * 1024)` from `@nxtqr/security` (returning HTTP `413`), parsed strictly via `OrchestrateRequestSchema` (Zod), and executed inside an isolated per-request `SimulationOrchestrator` disposed immediately after response.
- **Zero Real Infrastructure Execution**: All fault injection, Zero Trust attack-path, failover, and canary rollback models execute purely over in-memory modeled graphs and virtual clocks.

## Supabase Row Level Security (RLS)
- Migration `supabase/migrations/20261112000025_phase05_unified_orchestration.sql` adds `unified_simulation_runs`, `unified_simulation_checkpoints`, `unified_simulation_findings`, and `unified_capability_audits` with `ON DELETE CASCADE` FKs and `is_workspace_member(workspace_id)` / `is_workspace_admin(workspace_id)` policies.
- Automated SQL assertion suite `supabase/tests/rls_test.sql` checks `relrowsecurity` on both foundation and Phase 05.4.25 tables and verifies `SECURITY DEFINER` definitions on helper functions.

