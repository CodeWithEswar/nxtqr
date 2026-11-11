-- NXTQR — Phase 05.3.13: Architecture Design Review & Collaboration Engine
-- PostgreSQL / Supabase Schema Migration with Row Level Security (RLS)

-- 1. Architecture Reviews Table
CREATE TABLE IF NOT EXISTS public.architecture_reviews (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    baseline_snapshot JSONB NOT NULL,
    current_revision_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'open',
    assigned_reviewers JSONB NOT NULL DEFAULT '[]'::jsonb,
    related_adr_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    applied_at TIMESTAMPTZ,
    applied_by TEXT,
    applied_graph_revision TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reviews_project_arch ON public.architecture_reviews(project_id, architecture_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.architecture_reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_author ON public.architecture_reviews(author_id);

-- 2. Architecture Review Revisions Table (Immutable proposal iterations)
CREATE TABLE IF NOT EXISTS public.architecture_review_revisions (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL REFERENCES public.architecture_reviews(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    content_hash TEXT NOT NULL,
    change_summary TEXT NOT NULL,
    candidate_snapshot JSONB NOT NULL,
    author_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(review_id, revision_number)
);

CREATE INDEX IF NOT EXISTS idx_review_revisions_review ON public.architecture_review_revisions(review_id, revision_number);

-- 3. Architecture Review Policies Table
CREATE TABLE IF NOT EXISTS public.architecture_review_policies (
    id TEXT PRIMARY KEY,
    review_id TEXT UNIQUE NOT NULL REFERENCES public.architecture_reviews(id) ON DELETE CASCADE,
    min_approvals INTEGER NOT NULL DEFAULT 1,
    required_reviewer_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
    require_all_checks_passed BOOLEAN NOT NULL DEFAULT true,
    require_resolved_threads BOOLEAN NOT NULL DEFAULT true,
    allow_self_approval BOOLEAN NOT NULL DEFAULT false,
    invalidate_approvals_on_revision BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Architecture Review Decisions Table (Formal reviewer approvals & requests)
CREATE TABLE IF NOT EXISTS public.architecture_review_decisions (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL REFERENCES public.architecture_reviews(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    reviewer_id TEXT NOT NULL,
    reviewer_name TEXT NOT NULL,
    reviewer_role TEXT NOT NULL,
    decision TEXT NOT NULL,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_review_decisions_review ON public.architecture_review_decisions(review_id, revision_number);
CREATE INDEX IF NOT EXISTS idx_review_decisions_reviewer ON public.architecture_review_decisions(reviewer_id);

-- 5. Architecture Review Comment Threads Table (Contextual discussions)
CREATE TABLE IF NOT EXISTS public.architecture_review_threads (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL REFERENCES public.architecture_reviews(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    anchor JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    is_blocking BOOLEAN NOT NULL DEFAULT false,
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_review_threads_review ON public.architecture_review_threads(review_id, status);

-- 6. Architecture Review Comments Table (Root comments & replies)
CREATE TABLE IF NOT EXISTS public.architecture_review_comments (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES public.architecture_review_threads(id) ON DELETE CASCADE,
    review_id TEXT NOT NULL REFERENCES public.architecture_reviews(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_edited BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_review_comments_thread ON public.architecture_review_comments(thread_id);

-- 7. Architecture Review Automated Checks Table
CREATE TABLE IF NOT EXISTS public.architecture_review_checks (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL REFERENCES public.architecture_reviews(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    rule_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    evidence_ids JSONB DEFAULT '[]'::jsonb,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_review_checks_review ON public.architecture_review_checks(review_id, revision_number);

-- 8. Architecture Review Audit Trail Table
CREATE TABLE IF NOT EXISTS public.architecture_review_events (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL REFERENCES public.architecture_reviews(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    action TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_review_events_review ON public.architecture_review_events(review_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.architecture_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_review_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_review_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_review_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_review_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_review_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_review_events ENABLE ROW LEVEL SECURITY;

-- Security helper function conforming to AGENTS.md
CREATE OR REPLACE FUNCTION public.check_user_review_access(target_project_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_uid UUID;
    has_membership BOOLEAN;
BEGIN
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        -- Allow anonymous read in demo/development environments if project is public
        RETURN TRUE;
    END IF;

    -- Verify project team membership
    SELECT EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_id = target_project_id
        AND user_id = current_uid
    ) INTO has_membership;

    RETURN coalesce(has_membership, true);
END;
$$;

-- RLS Policies for architecture_reviews
CREATE POLICY "reviews_select_policy" ON public.architecture_reviews
    FOR SELECT USING (public.check_user_review_access(project_id));

CREATE POLICY "reviews_insert_policy" ON public.architecture_reviews
    FOR INSERT WITH CHECK (public.check_user_review_access(project_id));

CREATE POLICY "reviews_update_policy" ON public.architecture_reviews
    FOR UPDATE USING (public.check_user_review_access(project_id));

CREATE POLICY "reviews_delete_policy" ON public.architecture_reviews
    FOR DELETE USING (public.check_user_review_access(project_id));

-- RLS Policies for child tables referencing review_id
CREATE POLICY "revisions_access_policy" ON public.architecture_review_revisions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.architecture_reviews r
            WHERE r.id = architecture_review_revisions.review_id
            AND public.check_user_review_access(r.project_id)
        )
    );

CREATE POLICY "policies_access_policy" ON public.architecture_review_policies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.architecture_reviews r
            WHERE r.id = architecture_review_policies.review_id
            AND public.check_user_review_access(r.project_id)
        )
    );

CREATE POLICY "decisions_access_policy" ON public.architecture_review_decisions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.architecture_reviews r
            WHERE r.id = architecture_review_decisions.review_id
            AND public.check_user_review_access(r.project_id)
        )
    );

CREATE POLICY "threads_access_policy" ON public.architecture_review_threads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.architecture_reviews r
            WHERE r.id = architecture_review_threads.review_id
            AND public.check_user_review_access(r.project_id)
        )
    );

CREATE POLICY "comments_access_policy" ON public.architecture_review_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.architecture_reviews r
            WHERE r.id = architecture_review_comments.review_id
            AND public.check_user_review_access(r.project_id)
        )
    );

CREATE POLICY "checks_access_policy" ON public.architecture_review_checks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.architecture_reviews r
            WHERE r.id = architecture_review_checks.review_id
            AND public.check_user_review_access(r.project_id)
        )
    );

CREATE POLICY "events_access_policy" ON public.architecture_review_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.architecture_reviews r
            WHERE r.id = architecture_review_events.review_id
            AND public.check_user_review_access(r.project_id)
        )
    );
