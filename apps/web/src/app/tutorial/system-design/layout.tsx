import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Design Engineering Reference | NXTQR",
  description:
    "Comprehensive, full-window architectural reference for all 223 infrastructure components, distributed systems patterns, and production blueprints with live interactive visualizer integration.",
};

export default function SystemDesignTutorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full w-full bg-black">{children}</div>;
}
