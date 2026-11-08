"use client";

import * as React from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@nxtqr/ui";
import { TerminalIcon, SettingsIcon } from "@nxtqr/icons";

// ==========================================
// TABS DEMO
// ==========================================
export function TabsDemo() {
  return (
    <Tabs defaultValue="telemetry" className="w-full max-w-md">
      <TabsList className="grid w-full grid-cols-3 bg-secondary-surface">
        <TabsTrigger value="telemetry" className="text-xs font-mono">
          Telemetry
        </TabsTrigger>
        <TabsTrigger value="inspector" className="text-xs font-mono">
          Inspector
        </TabsTrigger>
        <TabsTrigger value="logs" className="text-xs font-mono">
          Live Logs
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="telemetry"
        className="p-4 rounded-md border border-border bg-surface text-xs font-mono space-y-2 mt-2"
      >
        <div className="flex justify-between">
          <span className="text-muted-foreground">FPS:</span>
          <span className="text-emerald-400 font-semibold">120.0 (Optimal)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Memory Heap:</span>
          <span className="text-foreground font-semibold">42.8 MB</span>
        </div>
      </TabsContent>
      <TabsContent
        value="inspector"
        className="p-4 rounded-md border border-border bg-surface text-xs font-mono text-muted-foreground mt-2"
      >
        Select a canvas node to inspect schema properties and edge connections.
      </TabsContent>
      <TabsContent
        value="logs"
        className="p-4 rounded-md border border-border bg-surface text-xs font-mono text-muted-foreground mt-2"
      >
        [09:14:02.102] Dispatcher worker cluster connected via TLS.
      </TabsContent>
    </Tabs>
  );
}

export const tabsDemoCode = `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@nxtqr/ui";

export function TabsDemo() {
  return (
    <Tabs defaultValue="telemetry">
      <TabsList>
        <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
        <TabsTrigger value="inspector">Inspector</TabsTrigger>
      </TabsList>
      <TabsContent value="telemetry">
        <p>120.0 FPS · 42.8 MB Heap</p>
      </TabsContent>
    </Tabs>
  );
}`;

// ==========================================
// BREADCRUMB DEMO
// ==========================================
export function BreadcrumbDemo() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/docs/components">Components</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Navigation Menu</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export const breadcrumbDemoCode = `import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@nxtqr/ui";

export function BreadcrumbDemo() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Navigation</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}`;

// ==========================================
// NAVIGATION MENU DEMO
// ==========================================
export function NavigationMenuDemo() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Studio Features</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid gap-3 p-4 w-[400px] bg-surface border border-border rounded-md shadow-level-2">
              <div className="p-3 bg-secondary-surface rounded-md border border-subtle-border">
                <h5 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <TerminalIcon className="h-4 w-4 text-accent" />
                  Visual Simulation Core
                </h5>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Deterministic graph execution with sub-millisecond timeline scrub.
                </p>
              </div>
              <div className="p-3 bg-secondary-surface rounded-md border border-subtle-border">
                <h5 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <SettingsIcon className="h-4 w-4 text-emerald-400" />
                  Edge Workers Dispatcher
                </h5>
                <p className="text-[11px] text-muted-foreground mt-1">
                  High-throughput event stream processing across distributed nodes.
                </p>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/docs" className="text-xs font-medium px-4 py-2">
            Documentation
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export const navigationMenuDemoCode = `import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@nxtqr/ui";

export function NavigationMenuDemo() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Features</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="p-4 w-[300px]">
              <h5>Simulation Core</h5>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}`;

// ==========================================
// MENUBAR DEMO
// ==========================================
export function MenubarDemo() {
  return (
    <Menubar className="border border-border bg-surface">
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New Visualizer Model <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Open Recent Graph... <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Save Trace Snapshot <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Undo Node Connection <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Toggle Precision Rail</MenubarItem>
          <MenubarItem>Reset Viewport Zoom</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

export const menubarDemoCode = `import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
} from "@nxtqr/ui";

export function MenubarDemo() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New Graph <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}`;

// ==========================================
// PAGINATION DEMO
// ==========================================
export function PaginationDemo() {
  const [page, setPage] = React.useState(2);

  return (
    <div className="flex flex-col items-center gap-3">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage((p) => Math.max(1, p - 1));
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              isActive={page === 1}
              onClick={(e) => {
                e.preventDefault();
                setPage(1);
              }}
            >
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              isActive={page === 2}
              onClick={(e) => {
                e.preventDefault();
                setPage(2);
              }}
            >
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              isActive={page === 3}
              onClick={(e) => {
                e.preventDefault();
                setPage(3);
              }}
            >
              3
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage((p) => Math.min(10, p + 1));
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <span className="text-xs font-mono text-muted-foreground">
        Active Page: <span className="text-foreground font-semibold">{page}</span> of 10
      </span>
    </div>
  );
}

export const paginationDemoCode = `import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@nxtqr/ui";

export function PaginationDemo() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}`;

// ==========================================
// COMMAND DEMO
// ==========================================
export function CommandDemo() {
  return (
    <div className="w-full max-w-sm rounded-md border border-border bg-surface shadow-level-1 overflow-hidden">
      <Command>
        <CommandInput placeholder="Type a command or filter nodes..." />
        <CommandList className="max-h-[160px] p-2">
          <CommandEmpty>No matching engineering nodes.</CommandEmpty>
          <CommandGroup heading="Graph Nodes">
            <CommandItem>Transform Matrix Node</CommandItem>
            <CommandItem>Edge Queue Worker</CommandItem>
            <CommandItem>Sink Telemetry Logger</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}

export const commandDemoCode = `import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@nxtqr/ui";

export function CommandDemo() {
  return (
    <Command className="border border-border rounded-md">
      <CommandInput placeholder="Type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem>Transform Matrix Node</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}`;
