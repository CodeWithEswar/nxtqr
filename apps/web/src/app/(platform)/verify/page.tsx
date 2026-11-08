import type { Metadata } from "next";
import { VerificationPage } from "@/features/verification";

export const metadata: Metadata = {
  title: "Architecture & Infrastructure Diagnostics",
  description:
    "Production diagnostics console verifying monorepo packages, design system tokens, database contracts, and live runtime systems.",
};

export default function DiagnosticsRoute() {
  return <VerificationPage />;
}
