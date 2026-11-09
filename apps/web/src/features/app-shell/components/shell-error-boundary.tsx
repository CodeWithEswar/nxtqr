"use client";

import * as React from "react";
import { Button } from "@nxtqr/ui";
import { AlertCircleIcon, RefreshIcon } from "@nxtqr/icons";

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ShellErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[NXTQR Shell Error Boundary]", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-surface-01 select-none">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border-default bg-surface-02 text-red-400 mb-4 shadow-level-1">
            <AlertCircleIcon className="h-6 w-6" />
          </div>

          <h2 className="font-sans text-base font-bold text-foreground tracking-tight mb-1">
            {this.props.fallbackTitle ?? "Workspace Error"}
          </h2>

          <p className="font-sans text-xs text-text-muted max-w-md mb-4">
            An unexpected error occurred while rendering this workspace region. You can reset this
            panel or reload the studio.
          </p>

          {this.state.error && (
            <pre className="font-mono text-[10px] text-text-muted bg-surface-00 border border-border-default rounded-md p-2.5 max-w-lg overflow-x-auto text-left mb-4">
              {this.state.error.message}
            </pre>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="font-mono text-xs gap-1.5 rounded-md border-border-default"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              <span>Retry Region</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => window.location.reload()}
              className="font-mono text-xs rounded-md bg-foreground text-background"
            >
              Reload Studio
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
