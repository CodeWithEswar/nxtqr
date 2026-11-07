"use client";

import Link from "next/link";
import { Button } from "@nxtqr/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
        404 — Not Found
      </span>
      <h2 className="mt-2 text-sm font-semibold tracking-tight text-foreground">
        The requested resource does not exist
      </h2>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm">
        The specified path is not a registered route in the NXTQR studio platform.
      </p>
      <div className="mt-5">
        <Link href="/">
          <Button variant="outline" size="sm">
            Return to Studio
          </Button>
        </Link>
      </div>
    </div>
  );
}
