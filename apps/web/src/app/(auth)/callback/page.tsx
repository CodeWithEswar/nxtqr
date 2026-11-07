"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SpinnerIcon } from "@nxtqr/icons";

export default function AuthCallbackPage() {
  const router = useRouter();

  React.useEffect(() => {
    // Client-side callback exchange routing
    const timer = setTimeout(() => {
      router.push("/");
    }, 500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <SpinnerIcon className="h-6 w-6 text-accent mb-3" />
      <h2 className="text-sm font-semibold text-foreground">Completing authentication...</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Exchanging session credentials with Supabase.
      </p>
    </div>
  );
}
