import * as React from "react";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s · NXTQR Design System",
    default: "Documentation · NXTQR Design System",
  },
  description:
    "Interactive engineering documentation, component registry, and design system specifications for NXTQR.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
