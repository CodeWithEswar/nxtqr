"use client";

import * as React from "react";
import { WorkspacePanelHeader, type WorkspacePanelHeaderProps } from "./workspace-panel-header";
import { cn } from "@nxtqr/utils";

export interface WorkspacePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  headerProps?: WorkspacePanelHeaderProps;
  children: React.ReactNode;
  noScroll?: boolean;
}

export function WorkspacePanel({
  headerProps,
  children,
  className,
  noScroll = false,
  ...props
}: WorkspacePanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-full w-full bg-surface-01 min-w-0 overflow-hidden",
        className
      )}
      {...props}
    >
      {headerProps && <WorkspacePanelHeader {...headerProps} />}
      <div
        className={cn(
          "flex-1 min-h-0",
          noScroll ? "overflow-hidden" : "overflow-y-auto scrollbar-thin"
        )}
      >
        {children}
      </div>
    </div>
  );
}
