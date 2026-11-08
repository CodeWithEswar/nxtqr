"use client";

import * as React from "react";
import { getComponentDemo } from "../../registry/demo-registry";

export interface ComponentDemoViewProps {
  slug: string;
}

export function ComponentDemoView({ slug }: ComponentDemoViewProps) {
  const demo = getComponentDemo(slug);

  if (!demo) {
    return (
      <div className="p-4 rounded-md border border-border bg-surface font-mono text-xs text-muted-foreground">
        Demo not registered for slug: {slug}
      </div>
    );
  }

  const DemoComponent = demo.component;
  return <DemoComponent />;
}

export function DynamicPlayground({ slug }: { slug: string }) {
  const demo = getComponentDemo(slug);
  if (!demo || !demo.playground) {
    return null;
  }
  const PlaygroundComponent = demo.playground;
  return <PlaygroundComponent />;
}
