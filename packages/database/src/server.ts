import {
  createServerClient as createSupabaseServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import type { TypedSupabaseClient } from "./client";

export interface CookieStoreAdapter {
  get?: (name: string) => { value: string } | undefined | Promise<{ value: string } | undefined>;
  set?: (name: string, value: string, options: CookieOptions) => void | Promise<void>;
  remove?: (name: string, options: CookieOptions) => void | Promise<void>;
  getAll?: () => Array<{ name: string; value: string }> | Promise<Array<{ name: string; value: string }>>;
  setAll?: (
    cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>,
  ) => void | Promise<void>;
}

export function createServerClient(
  cookieStore: CookieStoreAdapter,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
): TypedSupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "[NXTQR Database] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const cookieHandlers =
    cookieStore.getAll && cookieStore.setAll
      ? {
          async getAll() {
            return (await cookieStore.getAll?.()) ?? [];
          },
          async setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
            try {
              await cookieStore.setAll?.(cookiesToSet);
            } catch {
              // The `setAll` method was called from a Server Component.
              // Can be ignored if you have middleware refreshing user sessions.
            }
          },
        }
      : {
          async get(name: string) {
            const cookie = await cookieStore.get?.(name);
            return cookie?.value;
          },
          async set(name: string, value: string, options: CookieOptions) {
            try {
              await cookieStore.set?.(name, value, options);
            } catch {
              // Ignored from Server Component
            }
          },
          async remove(name: string, options: CookieOptions) {
            try {
              await cookieStore.remove?.(name, options);
            } catch {
              // Ignored from Server Component
            }
          },
        };

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookieHandlers,
  }) as unknown as TypedSupabaseClient;
}
