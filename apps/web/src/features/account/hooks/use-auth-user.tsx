"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBrowserClient } from "@nxtqr/database/client";
import type { UserProfile } from "@/features/profiles";
import { signOutUser } from "@/features/auth/services/auth-service";

export interface AuthUserContextValue {
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthUserContext = React.createContext<AuthUserContextValue | null>(null);

export interface AuthUserProviderProps {
  initialProfile: UserProfile | null;
  children: React.ReactNode;
}

export function AuthUserProvider({
  initialProfile,
  children,
}: AuthUserProviderProps) {
  const router = useRouter();
  const [profile, setProfile] = React.useState<UserProfile | null>(initialProfile);
  const [isLoading, setIsLoading] = React.useState(false);

  // Cross-tab and live session listener
  React.useEffect(() => {
    const supabase = createBrowserClient();

    // 1. Supabase auth event subscriber
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        setProfile(null);
        router.push("/login");
        router.refresh();
      } else if (event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setProfile((prev) => (prev ? { ...prev, email: user.email || prev.email } : null));
        }
      }
    });

    // 2. Cross-tab signout broadcast sync
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel("nxtqr_session_sync");
        bc.onmessage = (msg) => {
          if (msg.data?.type === "SESSION_SIGNED_OUT") {
            setProfile(null);
            router.push("/login");
            router.refresh();
          }
        };
      } catch {
        // Fallback
      }
    }

    return () => {
      subscription.unsubscribe();
      if (bc) {
        try {
          bc.close();
        } catch {
          // Fallback
        }
      }
    };
  }, [router]);

  const signOut = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Broadcast signout across tabs
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const bc = new BroadcastChannel("nxtqr_session_sync");
          bc.postMessage({ type: "SESSION_SIGNED_OUT" });
          bc.close();
        } catch {
          // Fallback
        }
      }

      await signOutUser();
      setProfile(null);
      toast.info("Signed out of NXTQR Studio.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("An error occurred during sign out.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const refreshProfile = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (dbProfile) {
        setProfile({
          id: dbProfile.id,
          email: dbProfile.email,
          displayName: dbProfile.display_name,
          avatarUrl: dbProfile.avatar_url,
          createdAt: dbProfile.created_at,
          updatedAt: dbProfile.updated_at,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = React.useMemo<AuthUserContextValue>(
    () => ({
      profile,
      isLoading,
      signOut,
      refreshProfile,
    }),
    [profile, isLoading, signOut, refreshProfile]
  );

  return (
    <AuthUserContext.Provider value={value}>
      {children}
    </AuthUserContext.Provider>
  );
}

export function useAuthUser(): AuthUserContextValue {
  const context = React.useContext(AuthUserContext);
  if (!context) {
    throw new Error("useAuthUser must be used within an AuthUserProvider");
  }
  return context;
}

