-- NXTQR Phase 01: Safe Development Seed Data
-- Creates isolated development user profile, preference, workspace, and membership for testing.

-- Development User Profile (Matches local Supabase mock auth UID if available)
INSERT INTO public.profiles (id, email, display_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'lead.engineer@nxtqr.local', 'Lead Engineer')
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;

-- Development User Preferences
INSERT INTO public.user_preferences (id, theme_mode, accent_color, custom_accent_hex)
VALUES ('00000000-0000-0000-0000-000000000001', 'dark', 'monochrome', NULL)
ON CONFLICT (id) DO UPDATE SET theme_mode = EXCLUDED.theme_mode;

-- Default Development Workspace
INSERT INTO public.workspaces (id, name, slug, created_by)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Primary Engineering Studio',
  'primary-studio',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (slug) DO NOTHING;

-- Development Workspace Membership (Owner)
INSERT INTO public.workspace_members (workspace_id, user_id, role)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'owner'
)
ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role;

