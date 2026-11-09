import * as React from "react";
import { type Metadata } from "next";
import { AppShell } from "@/features/app-shell";

export const metadata: Metadata = {
  title: {
    template: "%s · NXTQR Studio",
    default: "Workspace · NXTQR Studio",
  },
  description:
    "Interactive visual engineering studio for designing, visualizing, simulating, and understanding distributed systems.",
};

export default function WorkspaceRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}

