import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createBrowserClient(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "[NXTQR Database] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return createSupabaseBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
