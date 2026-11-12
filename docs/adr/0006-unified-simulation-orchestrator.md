# ADR-0006: Unified Simulation Orchestrator, Deterministic Runtime & Causal Pipeline

- **Status**: Accepted (Phase 05.4.25)
- **Date**: 2026-11-12

## Context
Phases `05.4.1`–`05.4.24` delivered 24 domain-specific execution engines and UI workspaces. Several engines generated `runId`, `correlationId`, or timestamps with `Date.now()` / `Math.random()`, operated independent run lifecycles without unified cancellation/checkpointing, and lacked a single composable cross-module execution path proving causal invariants (Zero Trust short-circuiting, rate-limit shedding, fault propagation, bottleneck ceiling laws).

## Decision
1. Introduce `@nxtqr/architecture-execution/src/orchestrator/` containing `SimulationOrchestrator`, `CapabilityRegistry`, `CrossModuleExecutionPipeline`, `CheckpointManager`, `EventIntegrityVerifier`, `UnifiedFindingsAggregator`, and `DeterministicPrng`/`createDeterministicId`.
2. Eliminate `Date.now()` and `Math.random()` inside all engine and preset outputs so identical graph snapshots + seeds yield byte-identical event traces and SHA fingerprints.
3. Unify Studio UI visibility via `UnifiedStudioDock`, filterable `ExecutionTimeline` (with bidirectional node focus), `ExecutionToolbar`, and `CommandPalette` without removing any existing domain workspace flows.
4. Harden `POST /api/architecture/simulations/orchestrate` and template API helpers (`x-nxtqr-test-user` strictly gated on `NODE_ENV === "test"`), and add `20261112000025_phase05_unified_orchestration.sql` with workspace-scoped RLS policies.

## Consequences
- Every Phase 05.4 simulation module remains independently runnable while gaining shared lifecycle, integrity, findings deduplication, checkpoint replay, and end-to-end cross-module verification.

