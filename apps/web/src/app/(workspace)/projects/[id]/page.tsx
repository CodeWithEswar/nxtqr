import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServerClient } from "@nxtqr/database/server";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

const ProjectIdParamSchema = z.string().uuid();

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  // 1. Route parameter format validation
  const validation = ProjectIdParamSchema.safeParse(id);
  if (!validation.success) {
    notFound();
  }

  // 2. Server-side session verification
  const cookieStore = await cookies();
  const supabase = createServerClient({
    get: (name) => cookieStore.get(name),
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?next=/projects/${id}`);
  }

  // 3. Layer 3: Server-side ownership verification with timing-safe non-existence masking
  // Query restricts to projects owned by the authenticated user
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, created_by, status")
    .eq("id", id)
    .eq("created_by", user.id)
    .maybeSingle();

  // If missing OR private to another user, trigger identical 404 response
  if (!project) {
    notFound();
  }

  // 4. Authorized owner navigation to visualizer canvas
  redirect(`/workspace?project=${id}`);
}
