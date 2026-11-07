-- NXTQR Phase 01: Initial Relational Foundation & RLS Migration

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. USER PREFERENCES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_mode TEXT NOT NULL DEFAULT 'dark' CHECK (theme_mode IN ('dark', 'light', 'system')),
  accent_color TEXT NOT NULL DEFAULT 'monochrome',
  custom_accent_hex TEXT,
  font_size TEXT NOT NULL DEFAULT 'md' CHECK (font_size IN ('sm', 'md', 'lg')),
  reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. WORKSPACES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. WORKSPACE MEMBERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

-- ==============================================================================
-- 5. PROJECTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  visualizer_type TEXT NOT NULL,
  graph_document JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. PROJECT MEMBERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

-- ==============================================================================
-- 7. AUDIT EVENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  event_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_workspace_members_updated_at
BEFORE UPDATE ON public.workspace_members
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- AUTO-PROVISION PROFILE & PREFERENCES ON USER SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  INSERT INTO public.user_preferences (id, theme_mode, accent_color)
  VALUES (NEW.id, 'dark', 'monochrome');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach signup trigger to auth.users if available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    CREATE OR REPLACE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ==============================================================================
-- RLS HELPER FUNCTIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- ROW LEVEL SECURITY ENFORCEMENT
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can read own profile and co-members"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm1
      JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid() AND wm2.user_id = public.profiles.id
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2. User Preferences Policies
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (id = auth.uid());

-- 3. Workspaces Policies
CREATE POLICY "Members can view workspaces"
  ON public.workspaces FOR SELECT
  USING (public.is_workspace_member(id));

CREATE POLICY "Authenticated users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Workspace admins can update workspaces"
  ON public.workspaces FOR UPDATE
  USING (public.is_workspace_admin(id))
  WITH CHECK (public.is_workspace_admin(id));

CREATE POLICY "Workspace owners can delete workspaces"
  ON public.workspaces FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = public.workspaces.id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- 4. Workspace Members Policies
CREATE POLICY "Members can view workspace members"
  ON public.workspace_members FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace admins can add members"
  ON public.workspace_members FOR INSERT
  WITH CHECK (public.is_workspace_admin(workspace_id));

CREATE POLICY "Workspace admins can update member roles"
  ON public.workspace_members FOR UPDATE
  USING (public.is_workspace_admin(workspace_id))
  WITH CHECK (public.is_workspace_admin(workspace_id));

CREATE POLICY "Workspace admins can remove members"
  ON public.workspace_members FOR DELETE
  USING (public.is_workspace_admin(workspace_id));

-- 5. Projects Policies
CREATE POLICY "Workspace members can view projects"
  ON public.projects FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    public.is_workspace_member(workspace_id) AND
    auth.uid() = created_by
  );

CREATE POLICY "Workspace admins or editors can update projects"
  ON public.projects FOR UPDATE
  USING (
    public.is_workspace_admin(workspace_id) OR
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = public.projects.id
        AND user_id = auth.uid()
        AND role = 'editor'
    )
  );

CREATE POLICY "Workspace admins can delete projects"
  ON public.projects FOR DELETE
  USING (public.is_workspace_admin(workspace_id));

-- 6. Project Members Policies
CREATE POLICY "Workspace members can view project members"
  ON public.project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND public.is_workspace_member(p.workspace_id)
    )
  );

CREATE POLICY "Workspace admins can manage project members"
  ON public.project_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND public.is_workspace_admin(p.workspace_id)
    )
  );

-- 7. Audit Events Policies
CREATE POLICY "Workspace admins can read audit events"
  ON public.audit_events FOR SELECT
  USING (public.is_workspace_admin(workspace_id));

CREATE POLICY "Server can record audit events"
  ON public.audit_events FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

