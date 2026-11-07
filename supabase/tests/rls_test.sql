-- NXTQR Database RLS Isolation Verification Test Suite

BEGIN;

-- Test 1: Verify RLS is enabled on all 7 foundation tables
DO $$
DECLARE
  tbl text;
  enabled boolean;
  tbls text[] := ARRAY['profiles', 'user_preferences', 'workspaces', 'workspace_members', 'projects', 'project_members', 'audit_events'];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    SELECT relrowsecurity INTO enabled
    FROM pg_class
    WHERE relname = tbl AND relnamespace = 'public'::regnamespace;

    IF NOT enabled THEN
      RAISE EXCEPTION 'RLS is not enabled on table %', tbl;
    END IF;
  END LOOP;
  RAISE NOTICE 'SUCCESS: RLS is active on all core tables.';
END $$;

-- Test 2: Verify helper functions exist and have SECURITY DEFINER
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'is_workspace_member' AND prosecdef = true
  ) THEN
    RAISE EXCEPTION 'is_workspace_member function is missing or lacks SECURITY DEFINER';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'is_workspace_admin' AND prosecdef = true
  ) THEN
    RAISE EXCEPTION 'is_workspace_admin function is missing or lacks SECURITY DEFINER';
  END IF;

  RAISE NOTICE 'SUCCESS: RLS security helper functions properly defined.';
END $$;

ROLLBACK;

