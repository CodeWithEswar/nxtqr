-- ==============================================================================
-- Migration: 20261112000023_phase05_system_design_practice.sql
-- Description: Phase 05.4.23 - Interactive System Design Interview Simulator,
--              Challenges, Evaluation Rubrics & Guided Engineering Labs with Strict RLS
-- ==============================================================================

-- 1. Challenge Catalog & Versioned Definitions
CREATE TABLE IF NOT EXISTS public.system_design_challenges (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  categories TEXT[] NOT NULL DEFAULT '{}',
  estimated_minutes INTEGER NOT NULL CHECK (estimated_minutes BETWEEN 15 AND 180),
  active_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'validated', 'published', 'deprecated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.system_design_rubrics (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  normalized BOOLEAN NOT NULL DEFAULT true,
  criteria JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (id, version)
);

CREATE TABLE IF NOT EXISTS public.system_design_challenge_versions (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES public.system_design_challenges(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version >= 1),
  rubric_id TEXT NOT NULL,
  rubric_version INTEGER NOT NULL DEFAULT 1,
  public_payload JSONB NOT NULL,
  evaluator_only_payload JSONB NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  FOREIGN KEY (rubric_id, rubric_version) REFERENCES public.system_design_rubrics(id, version),
  UNIQUE (challenge_id, version)
);

-- Separate evaluator answer-key table strictly blocked from client SELECT via RLS
CREATE TABLE IF NOT EXISTS public.system_design_challenge_answer_keys (
  challenge_version_id TEXT PRIMARY KEY REFERENCES public.system_design_challenge_versions(id) ON DELETE CASCADE,
  evaluator_only JSONB NOT NULL,
  hidden_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sd_challenges_difficulty ON public.system_design_challenges(difficulty, status);
CREATE INDEX IF NOT EXISTS idx_sd_challenges_slug ON public.system_design_challenges(slug);

-- 2. Interview Sessions & Event Log
CREATE TABLE IF NOT EXISTS public.system_design_sessions (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES public.system_design_challenges(id),
  challenge_version INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('learn', 'practice', 'mock-interview', 'engineering-lab')),
  pressure_mode TEXT NOT NULL DEFAULT 'standard' CHECK (pressure_mode IN ('relaxed', 'standard', 'strict')),
  status TEXT NOT NULL CHECK (status IN ('created', 'active', 'paused', 'submitted', 'evaluating', 'completed', 'evaluation_failed', 'abandoned')),
  current_phase TEXT NOT NULL DEFAULT 'problem_understanding',
  duration_limit_minutes INTEGER NOT NULL DEFAULT 45,
  monotonic_elapsed_ms BIGINT NOT NULL DEFAULT 0 CHECK (monotonic_elapsed_ms >= 0),
  architecture_revision_id TEXT,
  evaluation_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  FOREIGN KEY (challenge_id, challenge_version) REFERENCES public.system_design_challenge_versions(challenge_id, version)
);

CREATE INDEX IF NOT EXISTS idx_sd_sessions_user_status ON public.system_design_sessions(user_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.system_design_session_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.system_design_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor TEXT NOT NULL CHECK (actor IN ('candidate', 'interviewer', 'evaluator', 'system')),
  event_type TEXT NOT NULL,
  payload_version INTEGER NOT NULL DEFAULT 1,
  causal_ref TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  at_ms BIGINT NOT NULL CHECK (at_ms >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sd_session_events_session ON public.system_design_session_events(session_id, at_ms ASC);

-- 3. Discovered Requirements & Working Artifacts
CREATE TABLE IF NOT EXISTS public.system_design_requirements (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.system_design_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requirement_id TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('functional', 'nonfunctional', 'constraint', 'assumption', 'out_of_scope')),
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (session_id, requirement_id)
);

CREATE TABLE IF NOT EXISTS public.system_design_artifacts (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.system_design_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artifact_kind TEXT NOT NULL CHECK (artifact_kind IN ('estimation', 'api_design', 'data_model', 'architecture_ref', 'tradeoff_notes')),
  revision_number INTEGER NOT NULL DEFAULT 1 CHECK (revision_number >= 1),
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (session_id, artifact_kind)
);

-- 4. Submissions, Evaluations & Findings
CREATE TABLE IF NOT EXISTS public.system_design_submissions (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  session_id TEXT UNIQUE NOT NULL REFERENCES public.system_design_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  challenge_version INTEGER NOT NULL,
  architecture_revision_id TEXT NOT NULL,
  artifacts_snapshot JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.system_design_evaluations (
  id TEXT PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL REFERENCES public.system_design_sessions(id) ON DELETE CASCADE,
  submission_id TEXT UNIQUE NOT NULL REFERENCES public.system_design_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rubric_id TEXT NOT NULL,
  rubric_version INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'partial', 'completed', 'failed')),
  evaluated_weighted_score NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
  final_normalized_score NUMERIC(6, 2),
  criterion_results JSONB NOT NULL,
  evidences JSONB NOT NULL DEFAULT '[]'::jsonb,
  feedback JSONB NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.system_design_evaluation_findings (
  id TEXT PRIMARY KEY,
  evaluation_id TEXT NOT NULL REFERENCES public.system_design_evaluations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criterion_id TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  observed_issue TEXT NOT NULL,
  supporting_evidence_id TEXT NOT NULL,
  explanation TEXT NOT NULL,
  suggested_improvement TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'qualitative')),
  limitations TEXT NOT NULL DEFAULT ''
);

-- 5. Progressive Hints & Reveals
CREATE TABLE IF NOT EXISTS public.system_design_hints (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES public.system_design_challenges(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
  phase TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  prerequisite_hint_ids TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.system_design_hint_reveals (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.system_design_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hint_id TEXT NOT NULL REFERENCES public.system_design_hints(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
  revealed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (session_id, hint_id)
);

-- 6. Guided Engineering Labs, Attempts & Learning Progress
CREATE TABLE IF NOT EXISTS public.system_design_labs (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  lab_number INTEGER UNIQUE NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  topic TEXT NOT NULL,
  definition JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.system_design_lab_attempts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id TEXT NOT NULL REFERENCES public.system_design_labs(id) ON DELETE CASCADE,
  lab_version INTEGER NOT NULL DEFAULT 1,
  completed_step_ids TEXT[] NOT NULL DEFAULT '{}',
  simulation_run_ids TEXT[] NOT NULL DEFAULT '{}',
  validation_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.system_design_progress (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES public.system_design_challenges(id) ON DELETE CASCADE,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  completed BOOLEAN NOT NULL DEFAULT false,
  best_evaluated_score NUMERIC(6, 2),
  mastered_criteria TEXT[] NOT NULL DEFAULT '{}',
  improvement_areas TEXT[] NOT NULL DEFAULT '{}',
  last_attempt_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, challenge_id)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.system_design_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_design_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_design_challenge_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_design_challenge_answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_design_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_design_session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_design_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_design_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_design_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_design_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_design_evaluation_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_design_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_design_hint_reveals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_design_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_design_lab_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_design_progress ENABLE ROW LEVEL SECURITY;

-- Public read-only access to published challenges, rubrics & labs (NO writes by ordinary users)
CREATE POLICY "Authenticated users read published challenges"
  ON public.system_design_challenges FOR SELECT
  TO authenticated
  USING (status = 'published');

CREATE POLICY "Authenticated users read rubric schemas"
  ON public.system_design_rubrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users read published challenge public versions"
  ON public.system_design_challenge_versions FOR SELECT
  TO authenticated
  USING (published_at IS NOT NULL);

CREATE POLICY "Authenticated users read engineering labs"
  ON public.system_design_labs FOR SELECT
  TO authenticated
  USING (true);

-- Explicit deny policy for answer keys (only service role / server SECURITY DEFINER functions access)
CREATE POLICY "No client access to private challenge answer keys"
  ON public.system_design_challenge_answer_keys FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Hints only readable once explicitly revealed in an owned active session
CREATE POLICY "Users read hints only after session reveal"
  ON public.system_design_hints FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.system_design_hint_reveals r
      WHERE r.hint_id = system_design_hints.id AND r.user_id = auth.uid()
    )
  );

-- Strict user ownership policies on personal sessions, artifacts, submissions, evaluations, lab attempts & progress
CREATE POLICY "Users manage own system design sessions"
  ON public.system_design_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own session events"
  ON public.system_design_session_events FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own discovered requirements"
  ON public.system_design_requirements FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own design artifacts"
  ON public.system_design_artifacts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read & create own submissions"
  ON public.system_design_submissions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own evaluations"
  ON public.system_design_evaluations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own evaluation findings"
  ON public.system_design_evaluation_findings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own hint reveals"
  ON public.system_design_hint_reveals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own lab attempts"
  ON public.system_design_lab_attempts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own learning progress"
  ON public.system_design_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

