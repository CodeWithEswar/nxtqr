-- Phase 05.4.25: Unified Simulation Orchestrator, Checkpoints, Findings & Capability Audits
-- Consolidates persistence contracts across Phases 05.4.1 through 05.4.25 with strict tenant RLS isolation.

CREATE TABLE IF NOT EXISTS public.unified_simulation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id text NOT NULL,
  idempotency_key text,
  capability_id text NOT NULL,
  scenario_id text,
  run_state text NOT NULL CHECK (
    run_state IN ('created', 'validating', 'ready', 'running', 'paused', 'completed', 'cancelled', 'failed')
  ),
  deterministic_seed text NOT NULL DEFAULT '42',
  snapshot_digest text NOT NULL,
  total_steps integer NOT NULL DEFAULT 0 CHECK (total_steps >= 0),
  virtual_duration_ms integer NOT NULL DEFAULT 0 CHECK (virtual_duration_ms >= 0),
  integrity_valid boolean NOT NULL DEFAULT true,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  metrics_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  integrity_report_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_unified_sim_run_id UNIQUE (workspace_id, run_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unified_sim_runs_idempotency
  ON public.unified_simulation_runs (workspace_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_unified_sim_runs_workspace_created
  ON public.unified_simulation_runs (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unified_sim_runs_project
  ON public.unified_simulation_runs (project_id);

CREATE TABLE IF NOT EXISTS public.unified_simulation_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  simulation_run_pk uuid NOT NULL REFERENCES public.unified_simulation_runs(id) ON DELETE CASCADE,
  step_index integer NOT NULL CHECK (step_index >= 0),
  virtual_time_ms integer NOT NULL CHECK (virtual_time_ms >= 0),
  prng_state bigint NOT NULL DEFAULT 0,
  state_hash text NOT NULL,
  runtime_state_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_unified_checkpoint_step UNIQUE (simulation_run_pk, step_index)
);

CREATE INDEX IF NOT EXISTS idx_unified_checkpoints_run_step
  ON public.unified_simulation_checkpoints (simulation_run_pk, step_index);

CREATE TABLE IF NOT EXISTS public.unified_simulation_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  simulation_run_pk uuid NOT NULL REFERENCES public.unified_simulation_runs(id) ON DELETE CASCADE,
  dedupe_key text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  capability_id text NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  remediation text NOT NULL,
  provenance text NOT NULL,
  affected_node_ids text[] NOT NULL DEFAULT '{}',
  affected_edge_ids text[] NOT NULL DEFAULT '{}',
  evidence_event_sequences integer[] NOT NULL DEFAULT '{}',
  evidence_span_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_unified_finding_dedupe UNIQUE (simulation_run_pk, dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_unified_findings_workspace_severity
  ON public.unified_simulation_findings (workspace_id, severity);

CREATE TABLE IF NOT EXISTS public.unified_capability_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  snapshot_digest text NOT NULL,
  supported_count integer NOT NULL DEFAULT 0 CHECK (supported_count >= 0),
  partial_count integer NOT NULL DEFAULT 0 CHECK (partial_count >= 0),
  misconfigured_count integer NOT NULL DEFAULT 0 CHECK (misconfigured_count >= 0),
  unsupported_count integer NOT NULL DEFAULT 0 CHECK (unsupported_count >= 0),
  inspection_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unified_cap_audits_workspace
  ON public.unified_capability_audits (workspace_id, created_at DESC);

ALTER TABLE public.unified_simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_simulation_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_simulation_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_capability_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS unified_sim_runs_workspace_select ON public.unified_simulation_runs;
CREATE POLICY unified_sim_runs_workspace_select ON public.unified_simulation_runs
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS unified_sim_runs_workspace_insert ON public.unified_simulation_runs;
CREATE POLICY unified_sim_runs_workspace_insert ON public.unified_simulation_runs
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id) AND created_by = auth.uid());

DROP POLICY IF EXISTS unified_sim_runs_workspace_update ON public.unified_simulation_runs;
CREATE POLICY unified_sim_runs_workspace_update ON public.unified_simulation_runs
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS unified_sim_runs_workspace_delete ON public.unified_simulation_runs;
CREATE POLICY unified_sim_runs_workspace_delete ON public.unified_simulation_runs
  FOR DELETE USING (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS unified_checkpoints_workspace_select ON public.unified_simulation_checkpoints;
CREATE POLICY unified_checkpoints_workspace_select ON public.unified_simulation_checkpoints
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS unified_checkpoints_workspace_insert ON public.unified_simulation_checkpoints;
CREATE POLICY unified_checkpoints_workspace_insert ON public.unified_simulation_checkpoints
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS unified_findings_workspace_select ON public.unified_simulation_findings;
CREATE POLICY unified_findings_workspace_select ON public.unified_simulation_findings
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS unified_findings_workspace_insert ON public.unified_simulation_findings;
CREATE POLICY unified_findings_workspace_insert ON public.unified_simulation_findings
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS unified_cap_audits_workspace_select ON public.unified_capability_audits;
CREATE POLICY unified_cap_audits_workspace_select ON public.unified_capability_audits
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS unified_cap_audits_workspace_insert ON public.unified_capability_audits;
CREATE POLICY unified_cap_audits_workspace_insert ON public.unified_capability_audits
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

