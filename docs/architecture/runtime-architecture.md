# Runtime Architecture

## Three-Tier Runtime Boundaries

1. **Client Tier (Next.js Web App)**:
   - Server-side rendered shell with client-side reactive React Flow canvas.
   - Client interaction managed via Zustand (for canvas zoom, panning, tool mode) and TanStack Query (for asynchronous server state).
   - Zero-reload theme application through direct CSS variable manipulation on `document.documentElement`.
2. **Authoritative Relational Tier (Supabase PostgreSQL)**:
   - PostgreSQL is the sole authoritative store for user profiles, preferences, workspaces, projects, and audit logs.
   - Security enforced at the database layer via Row Level Security (RLS) policies and `SECURITY DEFINER` membership helpers.
3. **Edge Compute & Queue Tier (Cloudflare Workers)**:
   - Low-latency edge API routing, Turnstile bot protection, and rate limiting.
   - Asynchronous simulation jobs, exports, and heavy batch processing dispatched via Cloudflare Queues (`nxtqr-simulation-jobs`).
   - Large graph exports and generated simulation traces stored in private Cloudflare R2 buckets (`nxtqr-artifacts`).
