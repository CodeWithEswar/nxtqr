import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export type TypedSupabaseClient = SupabaseClient<
  Database,
  "public",
  "public",
  Database["public"]
>;

export function createBrowserClient(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
): TypedSupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "[NXTQR Database] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey) as unknown as TypedSupabaseClient;
}
