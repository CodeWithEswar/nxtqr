-- Migration: 20261109000002_phase03_auth_projects.sql
-- Description: Phase 03 - Premium Authentication, Identity & Project Infrastructure
-- Enforces project ownership, status tracking, avatar provisioning, and strict RLS policies.

-- 1. Add status and owner_id columns to public.projects if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    -- Backfill owner_id from created_by
    UPDATE public.projects SET owner_id = created_by WHERE owner_id IS NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived'));
  END IF;

  -- Allow projects to exist with or without explicit workspace linkage
  ALTER TABLE public.projects ALTER COLUMN workspace_id DROP NOT NULL;
END $$;

-- 2. Performance indexes for project listing and search
CREATE INDEX IF NOT EXISTS idx_projects_owner_status_updated 
  ON public.projects(owner_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_owner_name 
  ON public.projects(owner_id, name);

CREATE INDEX IF NOT EXISTS idx_profiles_email 
  ON public.profiles(email);

-- 3. Enhance auto-provision profile trigger to capture avatar_url from OAuth providers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();

  INSERT INTO public.user_preferences (id, theme_mode, accent_color)
  VALUES (NEW.id, 'dark', 'monochrome')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Idempotent helper function for explicit profile provisioning
CREATE OR REPLACE FUNCTION public.provision_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS public.profiles AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    p_user_id,
    p_email,
    COALESCE(p_display_name, split_part(p_email, '@', 1)),
    p_avatar_url
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW()
  RETURNING * INTO v_profile;

  INSERT INTO public.user_preferences (id, theme_mode, accent_color)
  VALUES (p_user_id, 'dark', 'monochrome')
  ON CONFLICT (id) DO NOTHING;

  RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Strict Project Ownership RLS Policies
-- Drop previous policies to avoid conflicts
DROP POLICY IF EXISTS "Workspace members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Workspace members can create projects" ON public.projects;
DROP POLICY IF EXISTS "Workspace admins or editors can update projects" ON public.projects;
DROP POLICY IF EXISTS "Workspace admins can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can select projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can update projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can delete projects" ON public.projects;

-- Strict Owner RLS: Only the project owner (or authenticated creator) can access their projects
CREATE POLICY "Owners can select projects"
  ON public.projects FOR SELECT
  USING (
    owner_id = auth.uid() OR
    created_by = auth.uid() OR
    (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
  );

CREATE POLICY "Owners can insert projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (owner_id = auth.uid() OR created_by = auth.uid())
  );

CREATE POLICY "Owners can update projects"
  ON public.projects FOR UPDATE
  USING (
    owner_id = auth.uid() OR created_by = auth.uid()
  )
  WITH CHECK (
    owner_id = auth.uid() OR created_by = auth.uid()
  );

CREATE POLICY "Owners can delete projects"
  ON public.projects FOR DELETE
  USING (
    owner_id = auth.uid() OR created_by = auth.uid()
  );

