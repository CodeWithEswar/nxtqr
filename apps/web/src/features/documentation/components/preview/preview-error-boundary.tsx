"use client";

import * as React from "react";
import { AlertCircleIcon, RefreshIcon } from "@nxtqr/icons";
import { Button } from "@nxtqr/ui";

interface PreviewErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface PreviewErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class PreviewErrorBoundary extends React.Component<
  PreviewErrorBoundaryProps,
  PreviewErrorBoundaryState
> {
  constructor(props: PreviewErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PreviewErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Preview render error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-md border border-destructive/40 bg-destructive/10 text-destructive flex flex-col items-center justify-center text-center gap-3">
          <AlertCircleIcon className="h-6 w-6 text-destructive" />
          <div className="space-y-1">
            <h4 className="font-mono text-xs font-semibold">
              {this.props.fallbackTitle ?? "Component Preview Error"}
            </h4>
            <p className="text-[11px] font-mono text-muted-foreground max-w-md">
              {this.state.error?.message ?? "An error occurred while mounting this interactive demo."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="h-7 text-xs font-mono gap-1.5"
          >
            <RefreshIcon className="h-3 w-3" />
            Retry Demo
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

