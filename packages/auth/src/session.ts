import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@nxtqr/database";

export async function getCurrentUser(client: SupabaseClient<Database>): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireAuthUser(client: SupabaseClient<Database>): Promise<User> {
  const user = await getCurrentUser(client);
  if (!user) {
    throw new Error("[NXTQR Auth] Unauthorized: Authentication session required");
  }
  return user;
}
