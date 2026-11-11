-- NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
-- PostgreSQL / Supabase Schema Migration with Row Level Security (RLS)

-- 1. Helper function for workspace project access authorization
CREATE OR REPLACE FUNCTION public.check_user_network_access(project_id_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user is authenticated and belongs to the project's workspace
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.projects p
        JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
        WHERE p.id = project_id_param
          AND wm.user_id = auth.uid()
    );
END;
$$;

-- 2. Network Topologies Table
CREATE TABLE IF NOT EXISTS public.network_topologies (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    graph_revision TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_network_topologies_proj_arch ON public.network_topologies(project_id, architecture_id);

-- 3. DNS Zones Table
CREATE TABLE IF NOT EXISTS public.dns_zones (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.network_topologies(id) ON DELETE CASCADE,
    domain_name TEXT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT false,
    vpc_ids JSONB,
    provider_technology TEXT NOT NULL,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_dns_zones_topology ON public.dns_zones(topology_id);

-- 4. DNS Records Table
CREATE TABLE IF NOT EXISTS public.dns_records (
    id TEXT PRIMARY KEY,
    zone_id TEXT NOT NULL REFERENCES public.dns_zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    record_type TEXT NOT NULL, -- 'A' | 'AAAA' | 'CNAME' | 'ALIAS' | 'TXT' | 'SRV' | 'MX' | 'NS' | 'PTR'
    ttl_seconds INTEGER NOT NULL DEFAULT 300,
    values JSONB NOT NULL DEFAULT '[]'::jsonb,
    target_resource_id TEXT,
    routing_policy JSONB,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_dns_records_zone ON public.dns_records(zone_id);

-- 5. CDN Distributions Table
CREATE TABLE IF NOT EXISTS public.cdn_distributions (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.network_topologies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain_names JSONB NOT NULL DEFAULT '[]'::jsonb,
    origin_target_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    waf_enabled BOOLEAN NOT NULL DEFAULT true,
    tls_mode TEXT NOT NULL DEFAULT 'edge_terminated',
    cache_policy_id TEXT,
    provider_technology TEXT NOT NULL,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cdn_distributions_topology ON public.cdn_distributions(topology_id);

-- 6. Load Balancers Table
CREATE TABLE IF NOT EXISTS public.load_balancers (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.network_topologies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    layer TEXT NOT NULL DEFAULT 'layer7', -- 'layer4' | 'layer7'
    scheme TEXT NOT NULL DEFAULT 'internet_facing', -- 'internet_facing' | 'internal'
    algorithm TEXT NOT NULL DEFAULT 'round_robin',
    listeners JSONB NOT NULL DEFAULT '[]'::jsonb,
    upstream_pool_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    cross_zone_load_balancing BOOLEAN NOT NULL DEFAULT true,
    provider_technology TEXT NOT NULL,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_load_balancers_topology ON public.load_balancers(topology_id);

-- 7. Upstream Pools Table
CREATE TABLE IF NOT EXISTS public.upstream_pools (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.network_topologies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    endpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
    health_check JSONB NOT NULL,
    connection_pool JSONB,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_upstream_pools_topology ON public.upstream_pools(topology_id);

-- 8. API Gateways Table
CREATE TABLE IF NOT EXISTS public.api_gateways (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.network_topologies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gateway_type TEXT NOT NULL, -- 'api_gateway' | 'reverse_proxy' | 'k8s_gateway' | 'k8s_ingress'
    listeners JSONB NOT NULL DEFAULT '[]'::jsonb,
    global_policies JSONB NOT NULL DEFAULT '{}'::jsonb,
    provider_technology TEXT NOT NULL,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_api_gateways_topology ON public.api_gateways(topology_id);

-- 9. Gateway Routes Table
CREATE TABLE IF NOT EXISTS public.gateway_routes (
    id TEXT PRIMARY KEY,
    gateway_id TEXT NOT NULL REFERENCES public.api_gateways(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    match JSONB NOT NULL,
    precedence_order INTEGER NOT NULL DEFAULT 100,
    target_upstream_pool_id TEXT NOT NULL,
    target_node_id TEXT,
    traffic_split JSONB,
    policies JSONB NOT NULL DEFAULT '{}'::jsonb,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_gateway_routes_gateway ON public.gateway_routes(gateway_id);

-- 10. Network Boundaries Table
CREATE TABLE IF NOT EXISTS public.network_boundaries (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.network_topologies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    boundary_type TEXT NOT NULL, -- 'public_internet' | 'edge_network' | 'dmz' | 'vpc_public' | 'vpc_private'
    cidr_block TEXT,
    region TEXT,
    zone TEXT,
    member_node_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    ingress_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    egress_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_network_boundaries_topology ON public.network_boundaries(topology_id);

-- 11. Service Meshes Table
CREATE TABLE IF NOT EXISTS public.service_meshes (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.network_topologies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mesh_type TEXT NOT NULL, -- 'istio' | 'linkerd' | 'consul' | 'kuma' | 'aws_app_mesh' | 'custom'
    mode TEXT NOT NULL DEFAULT 'sidecar',
    mtls_mode TEXT NOT NULL DEFAULT 'mtls_strict',
    participating_node_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    traffic_policies JSONB NOT NULL DEFAULT '[]'::jsonb,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_service_meshes_topology ON public.service_meshes(topology_id);

-- 12. Traffic Scenarios Table
CREATE TABLE IF NOT EXISTS public.traffic_scenarios (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.network_topologies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_id TEXT NOT NULL,
    destination_id TEXT NOT NULL,
    protocol TEXT NOT NULL DEFAULT 'https',
    request_rate_qps NUMERIC NOT NULL DEFAULT 100,
    average_payload_bytes INTEGER NOT NULL DEFAULT 1024,
    average_response_bytes INTEGER NOT NULL DEFAULT 4096,
    concurrency INTEGER NOT NULL DEFAULT 10,
    geographic_region TEXT,
    shift_mode TEXT,
    canary_percentage NUMERIC,
    simulated_failures JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_traffic_scenarios_topology ON public.traffic_scenarios(topology_id);

-- 13. Network Findings Records Table
CREATE TABLE IF NOT EXISTS public.network_findings_records (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.network_topologies(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    rationale TEXT NOT NULL,
    affected_resource_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    remediation TEXT NOT NULL,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_network_findings_topology ON public.network_findings_records(topology_id);
CREATE INDEX IF NOT EXISTS idx_network_findings_severity ON public.network_findings_records(severity);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all network tables
ALTER TABLE public.network_topologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dns_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dns_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdn_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_balancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upstream_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateway_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_meshes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_findings_records ENABLE ROW LEVEL SECURITY;

-- 1. network_topologies
CREATE POLICY "Users can view network topologies in permitted workspaces"
    ON public.network_topologies FOR SELECT
    USING (public.check_user_network_access(project_id));

CREATE POLICY "Users can create network topologies in permitted workspaces"
    ON public.network_topologies FOR INSERT
    WITH CHECK (public.check_user_network_access(project_id));

CREATE POLICY "Users can update network topologies in permitted workspaces"
    ON public.network_topologies FOR UPDATE
    USING (public.check_user_network_access(project_id))
    WITH CHECK (public.check_user_network_access(project_id));

CREATE POLICY "Users can delete network topologies in permitted workspaces"
    ON public.network_topologies FOR DELETE
    USING (public.check_user_network_access(project_id));

-- 2. dns_zones
CREATE POLICY "Users can manage dns_zones"
    ON public.dns_zones FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.network_topologies t
        WHERE t.id = dns_zones.topology_id
          AND public.check_user_network_access(t.project_id)
    ));

-- 3. dns_records
CREATE POLICY "Users can manage dns_records"
    ON public.dns_records FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.dns_zones z
        JOIN public.network_topologies t ON t.id = z.topology_id
        WHERE z.id = dns_records.zone_id
          AND public.check_user_network_access(t.project_id)
    ));

-- 4. cdn_distributions
CREATE POLICY "Users can manage cdn_distributions"
    ON public.cdn_distributions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.network_topologies t
        WHERE t.id = cdn_distributions.topology_id
          AND public.check_user_network_access(t.project_id)
    ));

-- 5. load_balancers
CREATE POLICY "Users can manage load_balancers"
    ON public.load_balancers FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.network_topologies t
        WHERE t.id = load_balancers.topology_id
          AND public.check_user_network_access(t.project_id)
    ));

-- 6. upstream_pools
CREATE POLICY "Users can manage upstream_pools"
    ON public.upstream_pools FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.network_topologies t
        WHERE t.id = upstream_pools.topology_id
          AND public.check_user_network_access(t.project_id)
    ));

-- 7. api_gateways
CREATE POLICY "Users can manage api_gateways"
    ON public.api_gateways FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.network_topologies t
        WHERE t.id = api_gateways.topology_id
          AND public.check_user_network_access(t.project_id)
    ));

-- 8. gateway_routes
CREATE POLICY "Users can manage gateway_routes"
    ON public.gateway_routes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.api_gateways g
        JOIN public.network_topologies t ON t.id = g.topology_id
        WHERE g.id = gateway_routes.gateway_id
          AND public.check_user_network_access(t.project_id)
    ));

-- 9. network_boundaries
CREATE POLICY "Users can manage network_boundaries"
    ON public.network_boundaries FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.network_topologies t
        WHERE t.id = network_boundaries.topology_id
          AND public.check_user_network_access(t.project_id)
    ));

-- 10. service_meshes
CREATE POLICY "Users can manage service_meshes"
    ON public.service_meshes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.network_topologies t
        WHERE t.id = service_meshes.topology_id
          AND public.check_user_network_access(t.project_id)
    ));

-- 11. traffic_scenarios
CREATE POLICY "Users can manage traffic_scenarios"
    ON public.traffic_scenarios FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.network_topologies t
        WHERE t.id = traffic_scenarios.topology_id
          AND public.check_user_network_access(t.project_id)
    ));

-- 12. network_findings_records
CREATE POLICY "Users can manage network_findings_records"
    ON public.network_findings_records FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.network_topologies t
        WHERE t.id = network_findings_records.topology_id
          AND public.check_user_network_access(t.project_id)
    ));
