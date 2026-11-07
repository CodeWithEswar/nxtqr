import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export function createAdminClient(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "[NXTQR Database] Missing SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY for admin client",
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
