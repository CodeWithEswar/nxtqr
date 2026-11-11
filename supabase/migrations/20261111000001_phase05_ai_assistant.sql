-- Migration: 20261111000001_phase05_ai_assistant.sql
-- Description: Phase 05.3.10 - AI Architecture Assistant Persistence & Conversations
-- Stores conversation threads, messages, citations, tool calls, and What-If proposals with strict RLS.

-- 1. Create AI Conversations Table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  architecture_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Architecture Discussion',
  graph_revision TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create AI Messages Table
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tool_calls JSONB,
  tool_call_id TEXT,
  name TEXT,
  citations JSONB,
  proposal JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for high-performance listing & retrieval
CREATE INDEX IF NOT EXISTS idx_ai_conversations_project_updated 
  ON public.ai_conversations(project_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user 
  ON public.ai_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_created 
  ON public.ai_messages(conversation_id, created_at ASC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Project Owner or Member Access
CREATE POLICY "Users can manage conversations for accessible projects"
  ON public.ai_conversations
  FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = ai_conversations.project_id
        AND (p.owner_id = auth.uid() OR p.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can manage messages in their conversations"
  ON public.ai_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = ai_messages.conversation_id
        AND (
          c.user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = c.project_id
              AND (p.owner_id = auth.uid() OR p.created_by = auth.uid())
          )
        )
    )
  );
