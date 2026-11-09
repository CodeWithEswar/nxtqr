import * as React from "react";
import { type Metadata } from "next";
import { EngineeringBackground, LoginCard } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign In · NXTQR Studio",
  description:
    "Sign in to NXTQR Interactive Visual Engineering Studio with Google authentication.",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full bg-black text-foreground flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden selection:bg-surface-04 selection:text-foreground">
      {/* Layer 2: Interactive Engineering Signal Field */}
      <EngineeringBackground />

      {/* Layer 3: Centered Solid-Neumorphic Card wrapped in Suspense */}
      <React.Suspense
        fallback={
          <div className="w-full max-w-[400px] h-96 rounded-md bg-surface-01 border border-border-default animate-pulse z-10" />
        }
      >
        <LoginCard />
      </React.Suspense>
    </main>
  );
}
