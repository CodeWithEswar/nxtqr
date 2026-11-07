# Supabase Infrastructure & Relational Data Model

## Relational PostgreSQL Tables

1. `profiles`: User identity, avatar, display name. Auto-created on auth user creation via PostgreSQL trigger.
2. `user_preferences`: Theme mode (`dark`, `light`, `system`), user accent (`preset`, `custom_hex`), font size, reduced motion.
3. `workspaces`: Multi-tenant workspace partitions. Unique slug, owner reference.
4. `workspace_members`: Workspace membership roster with roles (`owner`, `admin`, `member`, `viewer`).
5. `projects`: Visualizer graph documents. References `workspace_id` and `visualizer_type`. Persisted as JSONB.
6. `project_members`: Project-level granular permissions (`editor`, `viewer`).
7. `audit_events`: Workspace audit logs capturing security events, member invitations, and project modifications.

## Row Level Security (RLS) Strategy

- RLS is explicitly enabled on all 7 tables.
- Cross-tenant data leaks are prevented using helper functions `is_workspace_member(ws_id)` and `is_workspace_admin(ws_id)`.
- Users cannot escalate their own membership roles via ordinary update operations.
- Owners cannot be deleted or demoted by admins.
