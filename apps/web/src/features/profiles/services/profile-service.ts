import { createBrowserClient } from "@nxtqr/database/client";
import type { Database } from "@nxtqr/database";
import type { UserProfile, UpdateProfileInput } from "../schemas/profile.schema";
import { AppError } from "@/features/auth/lib/auth-errors";

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = createBrowserClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new AppError("RESOURCE_NOT_FOUND", `Failed to load user profile: ${error.message}`);
  }

  if (!profile) {
    // Self-provision fallback
    return {
      id: user.id,
      email: user.email || "",
      displayName: (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Engineer",
      avatarUrl: (user.user_metadata?.avatar_url as string) || null,
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at,
    };
  }

  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

export async function updateCurrentUserProfile(updates: UpdateProfileInput): Promise<UserProfile> {
  const supabase = createBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError("AUTH_SESSION_EXPIRED", "Authentication session required to update profile.");
  }

  const payload: Database["public"]["Tables"]["profiles"]["Update"] = {};
  if (updates.displayName !== undefined) payload.display_name = updates.displayName;
  if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;

  const { data: updated, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select()
    .single();

  if (error || !updated) {
    throw new AppError("UNKNOWN_ERROR", error?.message || "Failed to update profile.");
  }

  return {
    id: updated.id,
    email: updated.email,
    displayName: updated.display_name,
    avatarUrl: updated.avatar_url,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  };
}

