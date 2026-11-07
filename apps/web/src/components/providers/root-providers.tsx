"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@nxtqr/query";
import { TooltipProvider, Toaster } from "@nxtqr/ui";
import { useThemeStore } from "@nxtqr/state";

export function RootProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => createQueryClient());
  const hydrateFromLocal = useThemeStore((s) => s.hydrateFromLocal);

  React.useEffect(() => {
    hydrateFromLocal();
  }, [hydrateFromLocal]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
