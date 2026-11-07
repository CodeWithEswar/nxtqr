# Testing Strategy

## Test Levels

1. **Unit Testing (Vitest)**:
   - High coverage for pure functions: color conversions, contrast math, Zod schemas, state reducers, sanitization, formatters.
2. **Component Testing (React Testing Library)**:
   - Interaction testing for accessible buttons, dialogs, inputs, data table sorting/pagination, and theme changes.
3. **End-to-End Testing (Playwright)**:
   - Verifies complete application lifecycles: startup, pure black dark mode default, custom accent switching, and API health checks.
4. **Database Security Testing (SQL / Supabase)**:
   - SQL test scripts (`supabase/tests/rls_test.sql`) verifying that cross-tenant access is strictly blocked by RLS policies.
