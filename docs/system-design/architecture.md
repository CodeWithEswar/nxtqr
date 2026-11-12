# System Design Visualizer — Unified Architecture (Phase 05.4.25)

> **"One platform, multiple visualizers, shared engineering infrastructure."**

## Architectural Overview

NXTQR's System Design Visualizer integrates all 24 domain simulation engines (`05.4.1`–`05.4.24`) under a single cohesive runtime layer inside `@nxtqr/architecture-execution/src/orchestrator/` and exposes them inside the unified `apps/web` Studio Workspace (`GraphCanvas`, `ExecutionToolbar`, `ExecutionTimeline`, `UnifiedStudioDock`, `CommandPalette`).

```
+-------------------------------------------------------------------------+
|                       apps/web Studio Workspace                         |
|  GraphCanvas  |  ExecutionToolbar  |  ExecutionTimeline  | StudioDock   |
|                     useExecutionStore (Zustand)                         |
+------------------------------------+------------------------------------+
                                     |
         +---------------------------v---------------------------+
         |        @nxtqr/architecture-execution Orchestrator       |
         |  - SimulationOrchestrator (Run state machine & abort) |
         |  - CapabilityRegistry (24-module topology scanner)     |
         |  - CrossModuleExecutionPipeline (DNS -> ... -> OTel)  |
         |  - CheckpointManager (deterministic seeks & replay)   |
         |  - EventIntegrityVerifier (causal/clock validation)   |
         |  - UnifiedFindingsAggregator (deduped root causes)    |
         +---------------------------+---------------------------+
                                     |
         +---------------------------v---------------------------+
         |      24 Domain Engines (05.4.1 through 05.4.24)        |
         | VirtualClock | DeterministicPrng | ModeledRuntimeState |
         +-------------------------------------------------------+
```

## Module Responsibilities
- **Runtime & Orchestration**: `packages/architecture-execution/src/orchestrator/*`
- **Graph Validation & Contracts**: `packages/architecture-validation/*`, `packages/graph-schema/*`, `packages/node-registry/*`
- **Security & Size Guards**: `packages/security/*` (`assertPayloadSize`, `maskSensitiveData`)
- **API Route Boundary**: `apps/web/src/app/api/architecture/simulations/orchestrate/route.ts`
- **Supabase Multi-Tenant Schema**: `supabase/migrations/20261107000001` – `20261112000025_phase05_unified_orchestration.sql`

