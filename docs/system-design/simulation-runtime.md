# Unified Simulation Runtime, Determinism & Checkpoints

## Run Lifecycle State Machine
Every orchestrated simulation executes inside an isolated `SimulationRunRecord` managed by `SimulationOrchestrator` (`packages/architecture-execution/src/orchestrator/simulation-orchestrator.ts`):

- `created -> validating -> ready -> running -> paused -> completed | cancelled | failed`
- Every run receives deep-cloned `nodes` and `edges` so concurrent or repeated runs never mutate canvas data or share global runtime state.
- `cancelRun(runId)` aborts the run's `AbortController` immediately; `disposeRun(runId)` releases controller handles and state entries with zero retained timers or promises.

## Deterministic Guarantees
- All simulation IDs and ISO timestamps derive from `createDeterministicId()`, `computeDeterministicDigest()`, `DeterministicPrng` (Mulberry32), and `DETERMINISTIC_EPOCH_ISO` (`2026-11-12T00:00:00.000Z`).
- `Date.now()` and `Math.random()` are prohibited inside simulation engines and scenario preset builders.
- Same graph + configuration + seed guarantees identical `computeRunFingerprint()` SHA digests.

## Checkpointing & Seek Replay
- `CheckpointManager.buildCheckpoints()` emits periodic immutable snapshots containing `{ stepIndex, virtualTimeMs, prngState, stateHash, runtimeState }` bounded by `maxCheckpoints`.
- `CheckpointManager.seekWithCheckpointReplay()` restores the closest prior checkpoint and deterministically replays forward to `targetStepIndex`, verifying exact `stateHash` parity against linear step-by-step playback.

## Causal Event Integrity (`EventIntegrityVerifier`)
- Verifies strictly increasing event sequences, monotonic virtual timestamps (`atMs >= prev.atMs`), valid node/edge/parent-span ID resolution, and frame count parity.
- Returns structured `EventIntegrityReport` diagnostics cleanly on empty or malformed inputs without throwing unhandled exceptions.

