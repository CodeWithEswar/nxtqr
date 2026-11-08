export interface ComponentDemoDefinition {
  slug: string;
  name: string;
  description: string;
  code: string;
  hasPlayground?: boolean;
  category: "Actions" | "Forms" | "Overlays" | "Navigation" | "Data display" | "Layout" | "Feedback" | "Composite";
}

export const COMPONENT_DEMO_DEFINITIONS: Record<string, ComponentDemoDefinition> = {
  // Actions
  button: {
    slug: "button",
    name: "Button",
    description: "Tactile action controls with restrained elevation, solid pressed states, and dynamic accent styling.",
    code: `import { Button } from "@nxtqr/ui";

export function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Primary Action</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  );
}`,
    hasPlayground: true,
    category: "Actions",
  },
  toggle: {
    slug: "toggle",
    name: "Toggle",
    description: "Two-state pressed button for toggling states like grid snapping or inspector visibility.",
    code: `import { Toggle } from "@nxtqr/ui";
import { TerminalIcon, LayersIcon } from "@nxtqr/icons";

export function ToggleDemo() {
  return (
    <Toggle pressed={false}>
      <TerminalIcon className="h-4 w-4 mr-2" />
      <span>Run Trace</span>
    </Toggle>
  );
}`,
    category: "Actions",
  },
  "toggle-group": {
    slug: "toggle-group",
    name: "Toggle Group",
    description: "Coordinated set of two-state toggle buttons for exclusive or multiple selection modes.",
    code: `import { ToggleGroup, ToggleGroupItem } from "@nxtqr/ui";

export function ToggleGroupDemo() {
  return (
    <ToggleGroup type="single" defaultValue="grid">
      <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      <ToggleGroupItem value="list">Stream</ToggleGroupItem>
      <ToggleGroupItem value="inspect">Inspect</ToggleGroupItem>
    </ToggleGroup>
  );
}`,
    category: "Actions",
  },

  // Forms
  input: {
    slug: "input",
    name: "Input",
    description: "Single-line text input with high contrast foreground, solid background, and visible focus rings.",
    code: `import { Input } from "@nxtqr/ui";

export function InputDemo() {
  return (
    <div className="space-y-1.5 w-full max-w-sm">
      <label className="text-xs font-mono text-muted-foreground">Workspace Key</label>
      <Input placeholder="Enter API key..." defaultValue="api_live_94f83b12" />
    </div>
  );
}`,
    category: "Forms",
  },
  textarea: {
    slug: "textarea",
    name: "Textarea",
    description: "Multi-line text input area with vertical resize, compact font, and precision rail scrollbars.",
    code: `import { Textarea } from "@nxtqr/ui";

export function TextareaDemo() {
  return (
    <Textarea
      rows={4}
      placeholder="Enter SQL query..."
      defaultValue="SELECT * FROM nodes;"
    />
  );
}`,
    category: "Forms",
  },
  checkbox: {
    slug: "checkbox",
    name: "Checkbox",
    description: "Binary control toggling boolean states with custom check icons and keyboard accessibility.",
    code: `import { Checkbox } from "@nxtqr/ui";

export function CheckboxDemo() {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="rls" defaultChecked />
      <label htmlFor="rls" className="text-xs font-medium">
        Enforce Row-Level Security
      </label>
    </div>
  );
}`,
    category: "Forms",
  },
  "radio-group": {
    slug: "radio-group",
    name: "Radio Group",
    description: "A set of checkable buttons where only one button can be checked at a time.",
    code: `import { RadioGroup, RadioGroupItem } from "@nxtqr/ui";

export function RadioGroupDemo() {
  return (
    <RadioGroup defaultValue="isolated" className="space-y-2">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="isolated" id="isolated" />
        <label htmlFor="isolated" className="text-xs">Isolated Sandbox</label>
      </div>
    </RadioGroup>
  );
}`,
    category: "Forms",
  },
  switch: {
    slug: "switch",
    name: "Switch",
    description: "Tactile toggle switch for immediate boolean settings and feature flags.",
    code: `import { Switch } from "@nxtqr/ui";

export function SwitchDemo() {
  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-md">
      <span className="text-xs font-semibold">Telemetry Streaming</span>
      <Switch defaultChecked />
    </div>
  );
}`,
    hasPlayground: true,
    category: "Forms",
  },
  slider: {
    slug: "slider",
    name: "Slider",
    description: "Continuous or stepped range controls for numerical values like zoom levels and simulation speeds.",
    code: `import { Slider } from "@nxtqr/ui";

export function SliderDemo() {
  return <Slider defaultValue={[60]} min={10} max={120} step={5} />;
}`,
    hasPlayground: true,
    category: "Forms",
  },
  select: {
    slug: "select",
    name: "Select",
    description: "Dropdown selector menu with full keyboard navigation and solid neumorphic elevation.",
    code: `import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@nxtqr/ui";

export function SelectDemo() {
  return (
    <Select defaultValue="production">
      <SelectTrigger>
        <SelectValue placeholder="Select environment" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="development">Development</SelectItem>
        <SelectItem value="staging">Staging</SelectItem>
        <SelectItem value="production">Production</SelectItem>
      </SelectContent>
    </Select>
  );
}`,
    category: "Forms",
  },
  calendar: {
    slug: "calendar",
    name: "Calendar",
    description: "Date picker calendar surface with single, multiple, and range selection modes.",
    code: `import { Calendar } from "@nxtqr/ui";

export function CalendarDemo() {
  return <Calendar mode="single" className="rounded-md border border-border" />;
}`,
    category: "Forms",
  },

  // Overlays
  dialog: {
    slug: "dialog",
    name: "Dialog",
    description: "Accessible modal overlay for focused workflows, confirming destructive actions, and critical prompts.",
    code: `import {
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
}`,
    hasPlayground: true,
    category: "Overlays",
  },
  "alert-dialog": {
    slug: "alert-dialog",
    name: "Alert Dialog",
    description: "Modal dialog interrupting user flow to demand explicit confirmation before executing destructive operations.",
    code: `import {
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
}`,
    category: "Overlays",
  },
  sheet: {
    slug: "sheet",
    name: "Sheet",
    description: "Extends dialog to produce side-docked drawers for mobile navigation and complex inspector panels.",
    code: `import {
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
}`,
    category: "Overlays",
  },
  popover: {
    slug: "popover",
    name: "Popover",
    description: "Floating panel displaying rich interactive content anchored to a trigger control.",
    code: `import { Popover, PopoverTrigger, PopoverContent, Button } from "@nxtqr/ui";

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
}`,
    category: "Overlays",
  },
  tooltip: {
    slug: "tooltip",
    name: "Tooltip",
    description: "Compact hover popups explaining the function of toolbar buttons and icon controls.",
    code: `import {
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
}`,
    category: "Overlays",
  },
  "dropdown-menu": {
    slug: "dropdown-menu",
    name: "Dropdown Menu",
    description: "Displays a list of contextual actions or options triggered by a button, with submenus and keyboard navigation.",
    code: `import {
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
}`,
    category: "Overlays",
  },

  // Navigation
  tabs: {
    slug: "tabs",
    name: "Tabs",
    description: "Segmented view switcher with pressed active states and smooth keyboard orientation.",
    code: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@nxtqr/ui";

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
}`,
    category: "Navigation",
  },
  breadcrumb: {
    slug: "breadcrumb",
    name: "Breadcrumb",
    description: "Semantic navigational breadcrumbs adhering to WAI-ARIA breadcrumb design patterns.",
    code: `import {
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
}`,
    category: "Navigation",
  },
  "navigation-menu": {
    slug: "navigation-menu",
    name: "Navigation Menu",
    description: "Enterprise top-level navigation hierarchy with interactive dropdown viewport panels.",
    code: `import {
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
}`,
    category: "Navigation",
  },
  menubar: {
    slug: "menubar",
    name: "Menubar",
    description: "Desktop-grade application menubar with keyboard shortcuts and cascading submenus.",
    code: `import {
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
}`,
    category: "Navigation",
  },
  pagination: {
    slug: "pagination",
    name: "Pagination",
    description: "Navigation controls for paginating large data streams with accessible previous and next actions.",
    code: `import {
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
}`,
    category: "Navigation",
  },
  command: {
    slug: "command",
    name: "Command",
    description: "Fast, composable command palette and search dialog powered by cmdk with keyboard shortcuts.",
    code: `import {
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
}`,
    category: "Navigation",
  },

  // Data display
  table: {
    slug: "table",
    name: "Table",
    description: "High-density tabular data presentation with sticky headers and compact monospace metrics.",
    code: `import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
} from "@nxtqr/ui";

export function TableDemo() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Worker</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>worker_edge_01</TableCell>
          <TableCell><Badge variant="default">ONLINE</Badge></TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}`,
    category: "Data display",
  },
  "data-table": {
    slug: "data-table",
    name: "Data Table",
    description: "Composite data table powered by TanStack Table v8 with column sorting, filtering, and pagination.",
    code: `import { DataTable } from "@nxtqr/ui";

export function DataTableDemo() {
  return (
    <DataTable columns={traceColumns} data={traceData} />
  );
}`,
    category: "Data display",
  },
  card: {
    slug: "card",
    name: "Card",
    description: "Solid surface container with subtle border (#262626), restrained shadow (Level 1), and rounded-md radius.",
    code: `import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Button,
} from "@nxtqr/ui";

export function CardDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cluster Node</CardTitle>
        <CardDescription>Event queue worker</CardDescription>
      </CardHeader>
      <CardContent>
        <p>48,200 IOPS</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline">Inspect</Button>
      </CardFooter>
    </Card>
  );
}`,
    category: "Data display",
  },
  badge: {
    slug: "badge",
    name: "Badge",
    description: "Compact status indicators used strictly for meaningful state, version, severity, or counts.",
    code: `import { Badge } from "@nxtqr/ui";

export function BadgeDemo() {
  return (
    <div className="flex gap-2">
      <Badge variant="default">Accent</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">v1.0.0</Badge>
      <Badge variant="destructive">FAILED</Badge>
      <Badge variant="muted">STANDBY</Badge>
    </div>
  );
}`,
    hasPlayground: true,
    category: "Data display",
  },
  avatar: {
    slug: "avatar",
    name: "Avatar",
    description: "Circular visual representations of users or entities with automatic fallback initials.",
    code: `import { Avatar, AvatarFallback, AvatarImage } from "@nxtqr/ui";

export function AvatarDemo() {
  return (
    <Avatar>
      <AvatarImage src="/avatar.png" />
      <AvatarFallback>NQ</AvatarFallback>
    </Avatar>
  );
}`,
    category: "Data display",
  },
  progress: {
    slug: "progress",
    name: "Progress",
    description: "Horizontal progress bar displaying the completion status of long-running operations or simulations.",
    code: `import { Progress } from "@nxtqr/ui";

export function ProgressDemo() {
  return <Progress value={68} className="h-2" />;
}`,
    category: "Data display",
  },
  skeleton: {
    slug: "skeleton",
    name: "Skeleton",
    description: "Pulsing placeholder previews rendering layout structures during asynchronous network requests.",
    code: `import { Skeleton } from "@nxtqr/ui";

export function SkeletonDemo() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}`,
    category: "Data display",
  },

  // Layout
  accordion: {
    slug: "accordion",
    name: "Accordion",
    description: "Vertically stacked interactive disclosure headings with smooth expansion.",
    code: `import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@nxtqr/ui";

export function AccordionDemo() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>Architecture</AccordionTrigger>
        <AccordionContent>Pure black monochrome foundation.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}`,
    category: "Layout",
  },
  collapsible: {
    slug: "collapsible",
    name: "Collapsible",
    description: "Lightweight interactive component enabling sections of content to be expanded or collapsed.",
    code: `import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Button,
} from "@nxtqr/ui";

export function CollapsibleDemo() {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="outline">Toggle Details</Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p>Hidden variables</p>
      </CollapsibleContent>
    </Collapsible>
  );
}`,
    category: "Layout",
  },
  "scroll-area": {
    slug: "scroll-area",
    name: "Scroll Area",
    description: "Custom scrolling viewport with NXTQR Precision Rail tracks (10px, 7px compact, 7px canvas, 6px dense).",
    code: `import { ScrollArea } from "@nxtqr/ui";

export function ScrollAreaDemo() {
  return (
    <ScrollArea className="h-48 w-64 border border-border rounded-md p-4" variant="compact">
      <p>Precision Rail scrollable viewport content</p>
    </ScrollArea>
  );
}`,
    category: "Layout",
  },
  separator: {
    slug: "separator",
    name: "Separator",
    description: "Visual or semantic horizontal/vertical dividers with restrained subtle borders (#1C1C1C).",
    code: `import { Separator } from "@nxtqr/ui";

export function SeparatorDemo() {
  return (
    <div>
      <h5>Core</h5>
      <Separator className="my-2" />
      <div className="flex gap-2">
        <span>Item 1</span>
        <Separator orientation="vertical" />
        <span>Item 2</span>
      </div>
    </div>
  );
}`,
    category: "Layout",
  },
  "canvas-shell": {
    slug: "canvas-shell",
    name: "Canvas Shell",
    description: "The core layout container for interactive visualizers, isolating zooming/panning from panels.",
    code: `import { CanvasShell } from "@nxtqr/ui";

export function CanvasShellDemo() {
  return (
    <CanvasShell title="Visualizer Canvas Boundary" />
  );
}`,
    category: "Layout",
  },

  // Feedback
  alert: {
    slug: "alert",
    name: "Alert",
    description: "Prominent callout banners for informational, warning, and destructive notifications.",
    code: `import { Alert, AlertTitle, AlertDescription } from "@nxtqr/ui";

export function AlertDemo() {
  return (
    <Alert>
      <AlertTitle>Informational</AlertTitle>
      <AlertDescription>Simulation workers active.</AlertDescription>
    </Alert>
  );
}`,
    category: "Feedback",
  },
  sonner: {
    slug: "sonner",
    name: "Sonner",
    description: "High-performance toast notifications powered by Sonner with custom solid neumorphic styling.",
    code: `import { Button } from "@nxtqr/ui";
import { toast } from "sonner";

export function SonnerDemo() {
  return (
    <Button
      variant="default"
      onClick={() => toast.success("Graph snapshot committed.")}
    >
      Trigger Toast
    </Button>
  );
}`,
    category: "Feedback",
  },
  "empty-state": {
    slug: "empty-state",
    name: "Empty State",
    description: "Placeholder presentation displayed when lists, graphs, or queries return zero results.",
    code: `import { EmptyState, Button } from "@nxtqr/ui";
import { LayersIcon } from "@nxtqr/icons";

export function EmptyStateDemo() {
  return (
    <EmptyState
      icon={<LayersIcon className="h-5 w-5" />}
      title="No Active Recordings"
      description="Launch an execution trace to visualize live data packets."
      action={<Button variant="default">Start</Button>}
    />
  );
}`,
    category: "Feedback",
  },

  // Composite
  "date-picker": {
    slug: "date-picker",
    name: "Date Picker",
    description: "Popover date input for selecting single calendar timestamps with keyboard support.",
    code: `import { DatePicker } from "@nxtqr/ui";

export function DatePickerDemo() {
  return <DatePicker placeholder="Pick audit date" />;
}`,
    category: "Composite",
  },
  "search-field": {
    slug: "search-field",
    name: "Search Field",
    description: "Specialized search input with debounced input, clear button, and filter shortcut affordances.",
    code: `import { SearchField } from "@nxtqr/ui";

export function SearchFieldDemo() {
  return (
    <SearchField
      value=""
      onChange={() => {}}
      placeholder="Search nodes..."
    />
  );
}`,
    category: "Composite",
  },
  "filter-bar": {
    slug: "filter-bar",
    name: "Filter Bar",
    description: "Composite filter toolbar combining search fields, multi-select badges, and reset actions.",
    code: `import { FilterBar } from "@nxtqr/ui";

export function FilterBarDemo() {
  return (
    <FilterBar
      filters={[{ id: "status", label: "Status", value: "ONLINE" }]}
      onRemove={() => {}}
      onClearAll={() => {}}
    />
  );
}`,
    category: "Composite",
  },
  "confirm-action": {
    slug: "confirm-action",
    name: "Confirm Action",
    description: "Two-step confirmation button preventing accidental execution of destructive operations.",
    code: `import { ConfirmAction, Button } from "@nxtqr/ui";

export function ConfirmActionDemo() {
  return (
    <ConfirmAction
      trigger={<Button variant="destructive">Purge Telemetry</Button>}
      title="Purge Telemetry?"
      description="This action cannot be undone."
      confirmLabel="Purge"
      onConfirm={() => {}}
    />
  );
}`,
    category: "Composite",
  },
  "settings-field": {
    slug: "settings-field",
    name: "Settings Field",
    description: "Standardized settings row pairing a label, description, and control widget with alignment.",
    code: `import { SettingsField, Switch } from "@nxtqr/ui";

export function SettingsFieldDemo() {
  return (
    <SettingsField
      label="Strict RLS Audit Mode"
      description="Verify database role session credentials."
    >
      <Switch defaultChecked />
    </SettingsField>
  );
}`,
    category: "Composite",
  },
  kbd: {
    slug: "kbd",
    name: "Kbd",
    description: "Monospaced keyboard shortcut badges displaying key combos like ⌘K, Shift+Enter, or Esc.",
    code: `import { Kbd } from "@nxtqr/ui";

export function KbdDemo() {
  return (
    <div className="flex items-center gap-2">
      <Kbd>⌘K</Kbd>
      <Kbd>Space</Kbd>
    </div>
  );
}`,
    category: "Composite",
  },
};

export function getDemoDefinition(slug: string): ComponentDemoDefinition | undefined {
  const normalized = slug.replace(/^components\//, "").replace(/^\//, "");
  return COMPONENT_DEMO_DEFINITIONS[normalized];
}

