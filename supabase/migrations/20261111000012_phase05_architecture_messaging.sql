-- NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
-- PostgreSQL / Supabase Schema Migration with Row Level Security (RLS)

-- 1. Helper function for workspace project access authorization
CREATE OR REPLACE FUNCTION public.check_user_messaging_access(project_id_param text)
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
        WHERE p.id::text = project_id_param
          AND wm.user_id = auth.uid()
    );
END;
$$;

-- 2. Messaging Topologies Table
CREATE TABLE IF NOT EXISTS public.messaging_topologies (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    graph_revision TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_msg_topologies_proj_arch ON public.messaging_topologies(project_id, architecture_id);

-- 3. Messaging Brokers Table
CREATE TABLE IF NOT EXISTS public.messaging_brokers (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.messaging_topologies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    technology TEXT NOT NULL,
    cluster_mode TEXT NOT NULL DEFAULT 'clustered',
    is_multi_region BOOLEAN NOT NULL DEFAULT false,
    capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_msg_brokers_topology ON public.messaging_brokers(topology_id);
CREATE INDEX IF NOT EXISTS idx_msg_brokers_tech ON public.messaging_brokers(technology);

-- 4. Messaging Destinations Table (Queues, Topics, Streams)
CREATE TABLE IF NOT EXISTS public.messaging_destinations (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.messaging_topologies(id) ON DELETE CASCADE,
    broker_id TEXT NOT NULL,
    name TEXT NOT NULL,
    destination_type TEXT NOT NULL, -- 'queue' | 'topic' | 'stream' | 'exchange' | 'channel'
    delivery_semantics TEXT NOT NULL DEFAULT 'at_least_once',
    ordering_scope TEXT NOT NULL DEFAULT 'partition',
    partitioning JSONB,
    retention JSONB NOT NULL DEFAULT '{}'::jsonb,
    dead_letter_destination_id TEXT,
    max_delivery_attempts_before_dead_letter INTEGER,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_msg_destinations_topology ON public.messaging_destinations(topology_id);
CREATE INDEX IF NOT EXISTS idx_msg_destinations_type ON public.messaging_destinations(destination_type);
CREATE INDEX IF NOT EXISTS idx_msg_destinations_dlq ON public.messaging_destinations(dead_letter_destination_id);

-- 5. Messaging Producers Table
CREATE TABLE IF NOT EXISTS public.messaging_producers (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.messaging_topologies(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL,
    destination_id TEXT NOT NULL,
    event_types_published JSONB NOT NULL DEFAULT '[]'::jsonb,
    publication_rate_rps NUMERIC,
    uses_transactional_outbox BOOLEAN NOT NULL DEFAULT false,
    outbox_table_name TEXT,
    delivery_guarantee TEXT NOT NULL DEFAULT 'at_least_once_outbox',
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_msg_producers_dest ON public.messaging_producers(destination_id);
CREATE INDEX IF NOT EXISTS idx_msg_producers_service ON public.messaging_producers(service_id);

-- 6. Messaging Consumers Table
CREATE TABLE IF NOT EXISTS public.messaging_consumers (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.messaging_topologies(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL,
    destination_id TEXT NOT NULL,
    consumer_group_id TEXT,
    worker_concurrency INTEGER NOT NULL DEFAULT 1,
    event_types_consumed JSONB NOT NULL DEFAULT '[]'::jsonb,
    avg_processing_time_ms INTEGER NOT NULL DEFAULT 50,
    ack_mode TEXT NOT NULL DEFAULT 'explicit',
    retry_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
    idempotency JSONB NOT NULL DEFAULT '{}'::jsonb,
    uses_inbox_deduplication BOOLEAN NOT NULL DEFAULT false,
    has_side_effects BOOLEAN NOT NULL DEFAULT false,
    side_effect_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_msg_consumers_dest ON public.messaging_consumers(destination_id);
CREATE INDEX IF NOT EXISTS idx_msg_consumers_service ON public.messaging_consumers(service_id);
CREATE INDEX IF NOT EXISTS idx_msg_consumers_group ON public.messaging_consumers(consumer_group_id);

-- 7. Consumer Groups Table
CREATE TABLE IF NOT EXISTS public.consumer_groups (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.messaging_topologies(id) ON DELETE CASCADE,
    group_id TEXT NOT NULL,
    destination_id TEXT NOT NULL,
    consumer_service_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    active_workers_count INTEGER NOT NULL DEFAULT 1,
    lag_metrics JSONB,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_consumer_groups_dest ON public.consumer_groups(destination_id);
CREATE INDEX IF NOT EXISTS idx_consumer_groups_gid ON public.consumer_groups(group_id);

-- 8. Saga Workflows Table
CREATE TABLE IF NOT EXISTS public.saga_workflows (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.messaging_topologies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'choreography' | 'orchestration'
    initiating_event_type TEXT NOT NULL,
    states JSONB NOT NULL DEFAULT '[]'::jsonb,
    transitions JSONB NOT NULL DEFAULT '[]'::jsonb,
    consistency_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_saga_workflows_topology ON public.saga_workflows(topology_id);

-- 9. Messaging Findings Records Table
CREATE TABLE IF NOT EXISTS public.messaging_findings_records (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.messaging_topologies(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    affected_destination_id TEXT,
    affected_consumer_id TEXT,
    title TEXT NOT NULL,
    explanation TEXT NOT NULL,
    risk_analysis TEXT NOT NULL,
    remediation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_msg_findings_topology ON public.messaging_findings_records(topology_id);
CREATE INDEX IF NOT EXISTS idx_msg_findings_severity ON public.messaging_findings_records(severity);
CREATE INDEX IF NOT EXISTS idx_msg_findings_category ON public.messaging_findings_records(category);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.messaging_topologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_producers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saga_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_findings_records ENABLE ROW LEVEL SECURITY;

-- Messaging Topologies RLS
CREATE POLICY "Users can view messaging topologies in their projects"
    ON public.messaging_topologies FOR SELECT
    USING (public.check_user_messaging_access(project_id));

CREATE POLICY "Users can create messaging topologies in their projects"
    ON public.messaging_topologies FOR INSERT
    WITH CHECK (public.check_user_messaging_access(project_id));

CREATE POLICY "Users can update messaging topologies in their projects"
    ON public.messaging_topologies FOR UPDATE
    USING (public.check_user_messaging_access(project_id));

CREATE POLICY "Users can delete messaging topologies in their projects"
    ON public.messaging_topologies FOR DELETE
    USING (public.check_user_messaging_access(project_id));

-- Sub-table RLS via Topology join
CREATE POLICY "Users can view messaging brokers in their projects"
    ON public.messaging_brokers FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.messaging_topologies t
        WHERE t.id = messaging_brokers.topology_id
          AND public.check_user_messaging_access(t.project_id)
    ));

CREATE POLICY "Users can manage messaging brokers in their projects"
    ON public.messaging_brokers FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.messaging_topologies t
        WHERE t.id = messaging_brokers.topology_id
          AND public.check_user_messaging_access(t.project_id)
    ));

CREATE POLICY "Users can view messaging destinations in their projects"
    ON public.messaging_destinations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.messaging_topologies t
        WHERE t.id = messaging_destinations.topology_id
          AND public.check_user_messaging_access(t.project_id)
    ));

CREATE POLICY "Users can manage messaging destinations in their projects"
    ON public.messaging_destinations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.messaging_topologies t
        WHERE t.id = messaging_destinations.topology_id
          AND public.check_user_messaging_access(t.project_id)
    ));

CREATE POLICY "Users can manage messaging producers in their projects"
    ON public.messaging_producers FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.messaging_topologies t
        WHERE t.id = messaging_producers.topology_id
          AND public.check_user_messaging_access(t.project_id)
    ));

CREATE POLICY "Users can manage messaging consumers in their projects"
    ON public.messaging_consumers FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.messaging_topologies t
        WHERE t.id = messaging_consumers.topology_id
          AND public.check_user_messaging_access(t.project_id)
    ));

CREATE POLICY "Users can manage consumer groups in their projects"
    ON public.consumer_groups FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.messaging_topologies t
        WHERE t.id = consumer_groups.topology_id
          AND public.check_user_messaging_access(t.project_id)
    ));

CREATE POLICY "Users can manage saga workflows in their projects"
    ON public.saga_workflows FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.messaging_topologies t
        WHERE t.id = saga_workflows.topology_id
          AND public.check_user_messaging_access(t.project_id)
    ));

CREATE POLICY "Users can manage messaging findings in their projects"
    ON public.messaging_findings_records FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.messaging_topologies t
        WHERE t.id = messaging_findings_records.topology_id
          AND public.check_user_messaging_access(t.project_id)
    ));

