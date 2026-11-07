import {
  createServerClient as createSupabaseServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import type { Database } from "./types";

export interface CookieStoreAdapter {
  get: (name: string) => { value: string } | undefined | Promise<{ value: string } | undefined>;
  set?: (name: string, value: string, options: CookieOptions) => void | Promise<void>;
  remove?: (name: string, options: CookieOptions) => void | Promise<void>;
}

export function createServerClient(
  cookieStore: CookieStoreAdapter,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "[NXTQR Database] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async get(name: string) {
        const cookie = await cookieStore.get(name);
        return cookie?.value;
      },
      async set(name: string, value: string, options: CookieOptions) {
        try {
          await cookieStore.set?.(name, value, options);
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
      async remove(name: string, options: CookieOptions) {
        try {
          await cookieStore.remove?.(name, options);
        } catch {
          // Ignored from Server Component
        }
      },
    },
  });
}
