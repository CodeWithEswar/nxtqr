"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <h2 className="text-base font-semibold">Critical Application Failure</h2>
        <p className="mt-2 text-xs text-neutral-400 max-w-sm">
          {error.message || "A fatal error occurred at the root application shell."}
        </p>
        <button
          onClick={() => reset()}
          className="mt-4 px-3 py-1.5 text-xs rounded-md bg-white text-black font-medium hover:bg-neutral-200 transition-colors"
        >
          Reset Application
        </button>
      </body>
    </html>
  );
}
