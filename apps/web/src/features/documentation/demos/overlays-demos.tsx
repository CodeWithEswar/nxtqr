"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@nxtqr/ui";
import {
  SettingsIcon,
  AlertCircleIcon,
  TerminalIcon,
  MoreVerticalIcon,
  TrashIcon,
} from "@nxtqr/icons";

// ==========================================
// DIALOG DEMO
// ==========================================
export function DialogDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Open Pipeline Config</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Execution Pipeline</DialogTitle>
          <DialogDescription>
            Configure thread pooling, memory limits, and automated restart triggers for this visualizer model.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-xs font-mono text-muted-foreground space-y-2">
          <div className="p-3 rounded-md bg-secondary-surface border border-subtle-border">
            Concurrency: 8 Workers · Heap Budget: 512 MB
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="default" onClick={() => setOpen(false)}>
            Save Parameters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const dialogDemoCode = `import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@nxtqr/ui";

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">Open Pipeline Config</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Pipeline</DialogTitle>
          <DialogDescription>
            Adjust execution concurrency and memory limits.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="default">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}`;

// ==========================================
// ALERT DIALOG DEMO
// ==========================================
export function AlertDialogDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Workspace Model</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely certain?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently remove the visualizer graph, associated node telemetry, and historical simulation traces from the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Confirm Destruction
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const alertDialogDemoCode = `import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  Button,
} from "@nxtqr/ui";

export function AlertDialogDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Model</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Destruction</AlertDialogTitle>
          <AlertDialogDescription>
            This action permanently deletes all visualizer traces.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}`;

// ==========================================
// SHEET DEMO
// ==========================================
export function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <SettingsIcon className="h-4 w-4" />
          Open Inspector Sheet
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Node Inspector</SheetTitle>
          <SheetDescription>
            Inspect and edit runtime parameters for the selected node entity.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-4 text-xs font-mono">
          <div className="p-3 rounded-md bg-secondary-surface border border-subtle-border space-y-1">
            <span className="text-muted-foreground block text-[10px]">NODE IDENTIFIER</span>
            <span className="text-foreground font-semibold">node_transform_matrix_01</span>
          </div>
          <div className="p-3 rounded-md bg-secondary-surface border border-subtle-border space-y-1">
            <span className="text-muted-foreground block text-[10px]">STATUS</span>
            <span className="text-emerald-400 font-semibold">ACTIVE · 0.24ms LATENCY</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const sheetDemoCode = `import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
} from "@nxtqr/ui";

export function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Inspector</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Node Inspector</SheetTitle>
          <SheetDescription>Real-time graph metrics</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}`;

// ==========================================
// POPOVER DEMO
// ==========================================
export function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm">
          Dimensions Config
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 space-y-3 font-mono text-xs">
        <h4 className="font-semibold text-foreground">Canvas Viewport</h4>
        <div className="space-y-1 text-muted-foreground text-[11px]">
          <div>Width: 3840px (4K UHD)</div>
          <div>Height: 2160px</div>
          <div>Pixel Ratio: 2.0 (Retina)</div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const popoverDemoCode = `import { Popover, PopoverTrigger, PopoverContent, Button } from "@nxtqr/ui";

export function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">Dimensions</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 text-xs">
        <h4>Canvas Viewport</h4>
        <p>Width: 3840px · Height: 2160px</p>
      </PopoverContent>
    </Popover>
  );
}`;

// ==========================================
// TOOLTIP DEMO
// ==========================================
export function TooltipDemo() {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon">
              <TerminalIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Start simulation trace (Space)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View keyboard shortcuts documentation</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const tooltipDemoCode = `import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Button,
} from "@nxtqr/ui";

export function TooltipDemo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">Play</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Start simulation trace (Space)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}`;

// ==========================================
// DROPDOWN MENU DEMO
// ==========================================
export function DropdownMenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <span>Model Actions</span>
          <MoreVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Workspace Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <span>Duplicate Graph</span>
          <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <span>Export Schema JSON</span>
          <DropdownMenuShortcut>⇧⌘E</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
          <TrashIcon className="h-4 w-4 mr-2" />
          <span>Purge Simulation</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const dropdownMenuDemoCode = `import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  Button,
} from "@nxtqr/ui";

export function DropdownMenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Model Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <span>Duplicate</span>
          <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}`;
