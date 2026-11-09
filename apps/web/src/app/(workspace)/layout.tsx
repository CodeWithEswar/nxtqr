import * as React from "react";
import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@nxtqr/database/server";
import { AppShell } from "@/features/app-shell";
import { AuthUserProvider } from "@/features/account";
import type { UserProfile } from "@/features/profiles";

export const metadata: Metadata = {
  title: {
    template: "%s · NXTQR Studio",
    default: "Workspace · NXTQR Studio",
  },
  description:
    "Interactive visual engineering studio for designing, visualizing, simulating, and understanding distributed systems.",
};

export default async function WorkspaceRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient({
    get: (name) => cookieStore.get(name),
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Layer 2: Server-side identity verification guard
  if (error || !user) {
    redirect("/login?next=/workspace");
  }

  // Precedence-ordered initial profile resolution for zero-flicker hydration
  let initialProfile: UserProfile = {
    id: user.id,
    email: user.email || "",
    displayName:
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      "Studio Engineer",
    avatarUrl:
      (user.user_metadata?.avatar_url as string) ||
      (user.user_metadata?.picture as string) ||
      null,
    createdAt: user.created_at,
    updatedAt: user.updated_at || user.created_at,
  };

  try {
    const { data: dbProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (dbProfile) {
      initialProfile = {
        id: dbProfile.id,
        email: dbProfile.email || initialProfile.email,
        displayName: dbProfile.display_name || initialProfile.displayName,
        avatarUrl: dbProfile.avatar_url || initialProfile.avatarUrl,
        createdAt: dbProfile.created_at,
        updatedAt: dbProfile.updated_at,
      };
    }
  } catch {
    // Graceful fallback to provider identity
  }

  return (
    <AuthUserProvider initialProfile={initialProfile}>
      <AppShell>{children}</AppShell>
    </AuthUserProvider>
  );
}
