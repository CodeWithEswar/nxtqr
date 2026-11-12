import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@nxtqr/database/server";
import { templateRegistry } from "@nxtqr/architecture-execution";

export async function resolveAuthenticatedUser(request: NextRequest): Promise<{
  userId: string | null;
  workspaceIds: string[];
}> {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !(
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    ) {
      // Fall back to explicit header only in local test harnesses without Supabase env
      const headerUser = request.headers.get("x-nxtqr-test-user");
      return {
        userId: headerUser || null,
        workspaceIds: [],
      };
    }

    const cookieStore = await cookies();
    const supabase = createServerClient({
      get: (name) => cookieStore.get(name),
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from read-only server context
        }
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { userId: null, workspaceIds: [] };
    }

    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id);

    const workspaceIds = (memberships || [])
      .map((m) => String((m as { workspace_id: string }).workspace_id))
      .filter(Boolean);

    return { userId: user.id, workspaceIds };
  } catch {
    return { userId: null, workspaceIds: [] };
  }
}

export function resolveTemplateByIdOrSlug(idOrSlug: string, version?: string) {
  return (
    templateRegistry.getById(idOrSlug, version) ??
    templateRegistry.getBySlug(idOrSlug, version)
  );
}

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json(
    {
      error: message,
      ...extra,
    },
    { status }
  );
}
