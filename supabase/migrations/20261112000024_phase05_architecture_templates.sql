-- Phase 05.4.24: Architecture Templates, Reference Designs & Interactive Scenario Library
-- Persists system, workspace, public, and user-authored templates with immutable published versions,
-- scenarios, walkthroughs, favorites, instantiations, and usage telemetry under strict RLS.

CREATE TABLE IF NOT EXISTS public.architecture_templates (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('builtin', 'user', 'workspace', 'imported')),
  visibility TEXT NOT NULL CHECK (visibility IN ('system', 'private', 'workspace', 'public')),
  publication_status TEXT NOT NULL CHECK (
    publication_status IN ('DRAFT', 'VALIDATING', 'REJECTED', 'READY', 'PUBLISHED', 'DEPRECATED')
  ),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  category_ids TEXT[] NOT NULL DEFAULT '{}',
  concept_ids TEXT[] NOT NULL DEFAULT '{}',
  pattern_tags TEXT[] NOT NULL DEFAULT '{}',
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  estimated_learning_minutes INTEGER NOT NULL DEFAULT 15 CHECK (estimated_learning_minutes BETWEEN 5 AND 180),
  latest_version TEXT NOT NULL DEFAULT '1.0.0',
  source_template_id TEXT,
  deprecated_at TIMESTAMPTZ,
  deprecation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_workspace_visibility_has_workspace
    CHECK (visibility <> 'workspace' OR workspace_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.architecture_template_versions (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES public.architecture_templates(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changelog TEXT NOT NULL DEFAULT '',
  immutable BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL CHECK (
    status IN ('DRAFT', 'VALIDATING', 'REJECTED', 'READY', 'PUBLISHED', 'DEPRECATED')
  ),
  content_hash TEXT NOT NULL,
  manifest_json JSONB NOT NULL,
  topology_json JSONB NOT NULL,
  educational_pillars_json JSONB NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (template_id, version)
);

CREATE TABLE IF NOT EXISTS public.architecture_template_scenarios (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES public.architecture_templates(id) ON DELETE CASCADE,
  template_version TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 30000,
  seed INTEGER NOT NULL DEFAULT 1,
  workload_config_json JSONB NOT NULL,
  fault_schedule_json JSONB NOT NULL,
  configuration_overrides_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  expected_observations_json JSONB NOT NULL,
  validation_rule_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.architecture_template_walkthroughs (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES public.architecture_templates(id) ON DELETE CASCADE,
  template_version TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  steps_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.architecture_template_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES public.architecture_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, template_id)
);

CREATE TABLE IF NOT EXISTS public.architecture_template_instantiations (
  id TEXT PRIMARY KEY,
  source_template_id TEXT NOT NULL,
  source_template_version TEXT NOT NULL,
  source_template_slug TEXT NOT NULL,
  target_project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  target_revision_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.architecture_template_usage (
  template_id TEXT PRIMARY KEY REFERENCES public.architecture_templates(id) ON DELETE CASCADE,
  opens_count INTEGER NOT NULL DEFAULT 0,
  instantiations_count INTEGER NOT NULL DEFAULT 0,
  scenario_runs_count INTEGER NOT NULL DEFAULT 0,
  walkthrough_completions_count INTEGER NOT NULL DEFAULT 0,
  lab_launches_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast filtering & sorted catalog queries
CREATE INDEX IF NOT EXISTS idx_arch_templates_visibility_status
  ON public.architecture_templates (visibility, publication_status);
CREATE INDEX IF NOT EXISTS idx_arch_templates_owner
  ON public.architecture_templates (owner_id);
CREATE INDEX IF NOT EXISTS idx_arch_templates_workspace
  ON public.architecture_templates (workspace_id);
CREATE INDEX IF NOT EXISTS idx_arch_templates_categories_gin
  ON public.architecture_templates USING GIN (category_ids);
CREATE INDEX IF NOT EXISTS idx_arch_templates_concepts_gin
  ON public.architecture_templates USING GIN (concept_ids);
CREATE INDEX IF NOT EXISTS idx_arch_template_versions_tpl
  ON public.architecture_template_versions (template_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arch_template_instantiations_user
  ON public.architecture_template_instantiations (user_id, created_at DESC);

-- Prevent in-place mutation of immutable published versions
CREATE OR REPLACE FUNCTION public.prevent_published_template_version_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.immutable = TRUE OR OLD.status = 'PUBLISHED' THEN
    IF NEW.manifest_json IS DISTINCT FROM OLD.manifest_json
       OR NEW.topology_json IS DISTINCT FROM OLD.topology_json
       OR NEW.content_hash IS DISTINCT FROM OLD.content_hash
       OR NEW.version IS DISTINCT FROM OLD.version THEN
      RAISE EXCEPTION 'Published template versions are immutable; create a new version instead.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_published_template_version_mutation
  ON public.architecture_template_versions;

CREATE TRIGGER trg_prevent_published_template_version_mutation
  BEFORE UPDATE ON public.architecture_template_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_published_template_version_mutation();

-- Strict Row-Level Security
ALTER TABLE public.architecture_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_template_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_template_walkthroughs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_template_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_template_instantiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_template_usage ENABLE ROW LEVEL SECURITY;

-- Read access helper policy conditions
CREATE POLICY architecture_templates_select_policy
  ON public.architecture_templates
  FOR SELECT
  USING (
    visibility = 'system'
    OR (visibility = 'public' AND publication_status = 'PUBLISHED')
    OR (owner_id = auth.uid())
    OR (visibility = 'workspace' AND workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
  );

-- Owners can insert/update/delete non-system templates only
CREATE POLICY architecture_templates_insert_policy
  ON public.architecture_templates
  FOR INSERT
  WITH CHECK (
    source <> 'builtin'
    AND visibility <> 'system'
    AND owner_id = auth.uid()
    AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id))
  );

CREATE POLICY architecture_templates_update_policy
  ON public.architecture_templates
  FOR UPDATE
  USING (
    source <> 'builtin'
    AND visibility <> 'system'
    AND (
      owner_id = auth.uid()
      OR (workspace_id IS NOT NULL AND public.is_workspace_admin(workspace_id))
    )
  )
  WITH CHECK (
    source <> 'builtin'
    AND visibility <> 'system'
  );

CREATE POLICY architecture_templates_delete_policy
  ON public.architecture_templates
  FOR DELETE
  USING (
    source <> 'builtin'
    AND visibility <> 'system'
    AND (
      owner_id = auth.uid()
      OR (workspace_id IS NOT NULL AND public.is_workspace_admin(workspace_id))
    )
  );

-- Versions, Scenarios, Walkthroughs inherit parent template access
CREATE POLICY architecture_template_versions_select_policy
  ON public.architecture_template_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.architecture_templates t
      WHERE t.id = template_id
      AND (
        t.visibility = 'system'
        OR (t.visibility = 'public' AND t.publication_status = 'PUBLISHED')
        OR t.owner_id = auth.uid()
        OR (t.visibility = 'workspace' AND t.workspace_id IS NOT NULL AND public.is_workspace_member(t.workspace_id))
      )
    )
  );

CREATE POLICY architecture_template_versions_insert_policy
  ON public.architecture_template_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.architecture_templates t
      WHERE t.id = template_id
      AND t.source <> 'builtin'
      AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY architecture_template_scenarios_select_policy
  ON public.architecture_template_scenarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.architecture_templates t
      WHERE t.id = template_id
      AND (
        t.visibility = 'system'
        OR (t.visibility = 'public' AND t.publication_status = 'PUBLISHED')
        OR t.owner_id = auth.uid()
        OR (t.visibility = 'workspace' AND t.workspace_id IS NOT NULL AND public.is_workspace_member(t.workspace_id))
      )
    )
  );

CREATE POLICY architecture_template_walkthroughs_select_policy
  ON public.architecture_template_walkthroughs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.architecture_templates t
      WHERE t.id = template_id
      AND (
        t.visibility = 'system'
        OR (t.visibility = 'public' AND t.publication_status = 'PUBLISHED')
        OR t.owner_id = auth.uid()
        OR (t.visibility = 'workspace' AND t.workspace_id IS NOT NULL AND public.is_workspace_member(t.workspace_id))
      )
    )
  );

-- User favorites & instantiations are strictly user-scoped
CREATE POLICY architecture_template_favorites_all_policy
  ON public.architecture_template_favorites
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY architecture_template_instantiations_select_policy
  ON public.architecture_template_instantiations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY architecture_template_instantiations_insert_policy
  ON public.architecture_template_instantiations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY architecture_template_usage_select_policy
  ON public.architecture_template_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.architecture_templates t
      WHERE t.id = template_id
      AND (
        t.visibility = 'system'
        OR (t.visibility = 'public' AND t.publication_status = 'PUBLISHED')
        OR t.owner_id = auth.uid()
      )
    )
  );
