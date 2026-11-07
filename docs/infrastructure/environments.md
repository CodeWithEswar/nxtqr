# Environment Management & Secret Hygiene

## Environment Tiers

- **Development**: Local Next.js dev server (`http://localhost:3000`), local Supabase (`http://127.0.0.1:54321`), local Wrangler dev (`miniflare`).
- **Staging**: Cloudflare staging preview domains, Supabase staging project.
- **Production**: Production edge deployment, Supabase production cluster with connection pooling.

## Secret Isolation

- Browser-safe public variables are prefixed with `NEXT_PUBLIC_` (`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
- Privileged keys (`SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL`, `CF_API_TOKEN`) remain exclusively server-side.
- Secret rotation is performed without application downtime via zero-downtime key rotation policies.
