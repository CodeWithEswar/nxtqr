import Link from "next/link";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@nxtqr/ui";
import { ChevronRightIcon, CheckCircleIcon } from "@nxtqr/icons";

export default function AppearanceSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
          Design System & Appearance
        </h1>
        <p className="text-xs text-muted-foreground font-sans">
          NXTQR enforces a single, authoritative engineering standard: Pure Black Monochrome with Solid Neumorphism.
        </p>
      </div>

      <Card className="border border-border bg-surface">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-foreground" />
            <CardTitle className="text-sm font-semibold">Unified Monochrome Identity Active</CardTitle>
          </div>
          <CardDescription>
            Dynamic theme and accent color customization is permanently disabled across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-md border border-subtle-border bg-black space-y-1">
              <span className="text-[10px] text-muted-foreground block">BACKGROUND</span>
              <span className="font-bold text-foreground">#000000</span>
            </div>
            <div className="p-2.5 rounded-md border border-subtle-border bg-black space-y-1">
              <span className="text-[10px] text-muted-foreground block">FOREGROUND</span>
              <span className="font-bold text-foreground">#FFFFFF</span>
            </div>
            <div className="p-2.5 rounded-md border border-subtle-border bg-black space-y-1">
              <span className="text-[10px] text-muted-foreground block">SURFACE</span>
              <span className="font-bold text-foreground">#0A0A0A</span>
            </div>
            <div className="p-2.5 rounded-md border border-subtle-border bg-black space-y-1">
              <span className="text-[10px] text-muted-foreground block">BORDER</span>
              <span className="font-bold text-foreground">#262626</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-subtle-border">
            <span className="text-muted-foreground font-sans">Learn more about the architecture:</span>
            <Button asChild size="sm" variant="default" className="font-mono text-xs gap-1.5">
              <Link href="/docs/getting-started/design-system">
                <span>Design System Docs</span>
                <ChevronRightIcon className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
