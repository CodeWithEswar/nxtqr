# Security Standards

## Mandatory Security Controls

1. **Strict TypeScript**: `--strict`, `noImplicitAny`, and comprehensive interface coverage.
2. **Server-Side Authorization**: Never rely solely on client UI state or proxy rewrites for access checks. Every route and database query must verify workspace and project permissions.
3. **Database RLS**: Row Level Security enforced on every user-accessible table.
4. **Zod Validation**: All inbound network payloads, URL search parameters, and environment variables are strictly parsed against Zod schemas.
5. **Input Size Limits**: `assertPayloadSize` limits graph JSON documents to max 5MB and metadata to 256KB to prevent memory exhaustion.
6. **No Dynamic Code Execution**: Graph configurations and formula nodes are parsed declaratively. No `eval()`, `new Function()`, or un-sanitized script execution.
7. **Credential Masking**: All logs and error reporting pipelines pass through `maskSensitiveData` to scrub JWTs, passwords, and API keys.
