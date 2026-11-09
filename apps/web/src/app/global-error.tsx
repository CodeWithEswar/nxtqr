"use client";

import * as React from "react";
import { Button } from "@nxtqr/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[NXTQR Global Error]", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en" className="dark bg-black">
      <body className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans select-none">
        <div className="w-full max-w-md space-y-4">
          <span className="font-mono text-xs uppercase tracking-widest text-[#858585] px-2.5 py-0.5 rounded-md border border-[#262626] bg-[#0D0D0D]">
            System Recovery
          </span>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Critical Application Failure
          </h1>

          <p className="text-sm text-[#858585] leading-relaxed">
            A fatal error occurred at the root application shell. Please reset the studio application to resume your session.
          </p>

          {error.digest && (
            <div className="p-2 rounded-md bg-[#080808] border border-[#202020] font-mono text-[11px] text-[#858585]">
              Digest: {error.digest}
            </div>
          )}

          <div className="pt-2 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => reset()}
              className="h-8 px-4 text-xs font-mono font-medium rounded-md border-[#262626] bg-[#141414] hover:bg-[#1A1A1A] text-white"
            >
              Reset Application
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
