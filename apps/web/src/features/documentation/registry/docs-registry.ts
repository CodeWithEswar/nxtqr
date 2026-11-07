import type { DocEntry } from "../schemas/docs-schema";

export const DOCS_REGISTRY: DocEntry[] = [
  // ==========================================
  // GETTING STARTED
  // ==========================================
  {
    slug: "getting-started/introduction",
    title: "Introduction",
    description:
      "An overview of the NXTQR design system, architectural principles, and developer-crafted philosophy.",
    category: "Getting Started",
    order: 1,
    status: "ready",
  },
  {
    slug: "getting-started/installation",
    title: "Installation",
    description:
      "How to consume and configure @nxtqr/ui, @nxtqr/design-system, and icons in your application.",
    category: "Getting Started",
    order: 2,
    status: "ready",
  },
  {
    slug: "getting-started/quick-start",
    title: "Quick Start",
    description:
      "Build your first engineering surface with NXTQR primitives, custom accent colors, and tactile depth.",
    category: "Getting Started",
    order: 3,
    status: "ready",
  },
  {
    slug: "getting-started/project-structure",
    title: "Project Structure",
    description: "Monorepo boundaries, package ownership standards, and zero-leakage contracts.",
    category: "Getting Started",
    order: 4,
    status: "ready",
  },
  {
    slug: "getting-started/theming",
    title: "Theming & Accents",
    description:
      "Dynamic user-customizable accent colors, pure black monochrome foundations, and WCAG contrast rules.",
    category: "Getting Started",
    order: 5,
    status: "ready",
  },

  // ==========================================
  // FOUNDATIONS
  // ==========================================
  {
    slug: "foundations/colors",
    title: "Colors",
    description:
      "Pure monochrome grayscale hierarchy, calibrated pure saturated presets, and accessible contrast math.",
    category: "Foundations",
    order: 10,
    status: "ready",
  },
  {
    slug: "foundations/typography",
    title: "Typography",
    description:
      "Geist Sans and Geist Mono typography scales, line-height rules, and layout reflow prevention.",
    category: "Foundations",
    order: 11,
    status: "ready",
  },
  {
    slug: "foundations/spacing",
    title: "Spacing & Density",
    description: "High-density technical grid, compact metrics, and restrained padding hierarchy.",
    category: "Foundations",
    order: 12,
    status: "ready",
  },
  {
    slug: "foundations/radius",
    title: "Border Radius",
    description:
      "Strict rounded-md (0.375rem / 6px) standard across all rectangular engineering surfaces.",
    category: "Foundations",
    order: 13,
    status: "ready",
  },
  {
    slug: "foundations/elevation",
    title: "Elevation & Shadows",
    description:
      "Solid neumorphic depth without blurry glassmorphism: Level 0 Base, Level 1 Raised, Level 2 Elevated, Level 3 Pressed.",
    category: "Foundations",
    order: 14,
    status: "ready",
  },
  {
    slug: "foundations/solid-neumorphism",
    title: "Solid Neumorphism",
    description:
      "The tactile engineering philosophy of restrained directional shadows, inset borders, and crisp specular highlights.",
    category: "Foundations",
    order: 15,
    status: "ready",
  },
  {
    slug: "foundations/iconography",
    title: "Iconography",
    description:
      "Standardized Hugeicons wrappers with 1.5px stroke width and 16px default metrics. No emojis.",
    category: "Foundations",
    order: 16,
    status: "ready",
  },
  {
    slug: "foundations/motion",
    title: "Motion & Keyframes",
    description:
      "Short functional micro-interactions (100–150ms) with mandatory prefers-reduced-motion: reduce enforcement.",
    category: "Foundations",
    order: 17,
    status: "ready",
  },
  {
    slug: "foundations/accessibility",
    title: "Accessibility",
    description:
      "Full keyboard focus rings, WCAG 2.1 AA/AAA contrast conformance, and ARIA semantic landmarks.",
    category: "Foundations",
    order: 18,
    status: "ready",
  },
  {
    slug: "foundations/responsive",
    title: "Responsive Design",
    description: "Mobile sheets, container queries, and responsive high-density layouts.",
    category: "Foundations",
    order: 19,
    status: "ready",
  },
  {
    slug: "foundations/scrollbars",
    title: "Precision Rail Scrollbars",
    description:
      "NXTQR Precision Rail custom scrollbar system with compact 7px/6px tracks and dynamic accent drag feedback.",
    category: "Foundations",
    order: 20,
    status: "ready",
  },

  // ==========================================
  // COMPONENTS (SHARED UI)
  // ==========================================
  {
    slug: "components/button",
    title: "Button",
    description:
      "Tactile action controls with restrained elevation, solid pressed states, and dynamic accent styling.",
    category: "Components",
    order: 30,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/button.tsx",
    relatedSlugs: ["components/toggle", "components/badge"],
    props: [
      {
        name: "variant",
        type: '"default" | "secondary" | "outline" | "ghost" | "destructive" | "link"',
        default: '"default"',
        required: false,
        description: "The visual elevation and intent of the button.",
      },
      {
        name: "size",
        type: '"default" | "sm" | "lg" | "icon" | "icon-sm"',
        default: '"default"',
        required: false,
        description: "The dimension and padding metrics.",
      },
      {
        name: "isLoading",
        type: "boolean",
        default: "false",
        required: false,
        description: "Displays a loading spinner and disables pointer interactions.",
      },
      {
        name: "asChild",
        type: "boolean",
        default: "false",
        required: false,
        description: "Merges props into the direct child element via Radix Slot.",
      },
    ],
  },
  {
    slug: "components/badge",
    title: "Badge",
    description:
      "Compact status indicators used strictly for meaningful state, version, severity, or counts. Never purely decorative.",
    category: "Components",
    order: 31,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/badge.tsx",
    props: [
      {
        name: "variant",
        type: '"default" | "secondary" | "destructive" | "outline" | "success" | "warning"',
        default: '"default"',
        required: false,
        description: "Semantic intent and elevation styling.",
      },
    ],
  },
  {
    slug: "components/card",
    title: "Card",
    description:
      "Solid surface container with subtle border (#262626), restrained shadow (Level 1), and rounded-md radius.",
    category: "Components",
    order: 32,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/card.tsx",
  },
  {
    slug: "components/input",
    title: "Input",
    description:
      "Single-line text input with high contrast foreground, solid background, and visible focus rings.",
    category: "Components",
    order: 33,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/input.tsx",
    props: [
      {
        name: "type",
        type: "string",
        default: '"text"',
        required: false,
        description: "HTML input type (text, password, number, email, etc.).",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        required: false,
        description: "Disables interaction and renders dimmed styling.",
      },
    ],
  },
  {
    slug: "components/textarea",
    title: "Textarea",
    description:
      "Multi-line text input area with vertical resize, compact font, and precision rail scrollbars.",
    category: "Components",
    order: 34,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/textarea.tsx",
  },
  {
    slug: "components/dialog",
    title: "Dialog",
    description:
      "Accessible modal overlay for focused workflows, confirming destructive actions, and critical prompts.",
    category: "Components",
    order: 35,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/dialog.tsx",
  },
  {
    slug: "components/select",
    title: "Select",
    description:
      "Dropdown selector menu with full keyboard navigation and solid neumorphic elevation (Level 2).",
    category: "Components",
    order: 36,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/select.tsx",
  },
  {
    slug: "components/tabs",
    title: "Tabs",
    description:
      "Segmented view switcher with pressed active states and smooth keyboard orientation.",
    category: "Components",
    order: 37,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/tabs.tsx",
  },
  {
    slug: "components/table",
    title: "Table",
    description:
      "High-density tabular data presentation with sticky headers and compact monospace metrics.",
    category: "Components",
    order: 38,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/table.tsx",
  },
  {
    slug: "components/data-table",
    title: "Data Table",
    description:
      "Composite data table powered by TanStack Table v8 with column sorting, filtering, and pagination.",
    category: "Components",
    order: 39,
    status: "ready",
    sourcePath: "packages/ui/src/components/composite/data-table/data-table.tsx",
  },
  {
    slug: "components/scroll-area",
    title: "Scroll Area",
    description:
      "Custom scrolling viewport with NXTQR Precision Rail tracks (10px, 7px compact, 7px canvas, 6px dense).",
    category: "Components",
    order: 40,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/scroll-area.tsx",
    props: [
      {
        name: "variant",
        type: '"default" | "compact" | "canvas" | "dense"',
        default: '"default"',
        required: false,
        description: "Selects rail thickness and corner radius.",
      },
      {
        name: "orientation",
        type: '"vertical" | "horizontal" | "both"',
        default: '"vertical"',
        required: false,
        description: "The scrolling axis to support.",
      },
    ],
  },
  {
    slug: "components/command",
    title: "Command",
    description:
      "Fast, composable command palette and search dialog powered by cmdk with keyboard shortcuts.",
    category: "Components",
    order: 41,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/command.tsx",
  },
  {
    slug: "components/accordion",
    title: "Accordion",
    description: "Vertically stacked interactive disclosure headings with smooth expansion.",
    category: "Components",
    order: 42,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/accordion.tsx",
  },
  {
    slug: "components/alert",
    title: "Alert",
    description:
      "Prominent callout banners for informational, warning, and destructive notifications.",
    category: "Components",
    order: 43,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/alert.tsx",
  },
  {
    slug: "components/alert-dialog",
    title: "Alert Dialog",
    description:
      "Modal dialog interrupting user flow to demand explicit confirmation before executing destructive operations.",
    category: "Components",
    order: 44,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/alert-dialog.tsx",
  },
  {
    slug: "components/avatar",
    title: "Avatar",
    description:
      "Circular visual representations of users or entities with automatic fallback initials.",
    category: "Components",
    order: 45,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/avatar.tsx",
  },
  {
    slug: "components/checkbox",
    title: "Checkbox",
    description:
      "Binary control toggling boolean states with custom check icons and keyboard accessibility.",
    category: "Components",
    order: 46,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/checkbox.tsx",
  },
  {
    slug: "components/collapsible",
    title: "Collapsible",
    description:
      "Lightweight interactive component enabling sections of content to be expanded or collapsed.",
    category: "Components",
    order: 47,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/collapsible.tsx",
  },
  {
    slug: "components/dropdown-menu",
    title: "Dropdown Menu",
    description:
      "Displays a list of contextual actions or options triggered by a button, with submenus and keyboard navigation.",
    category: "Components",
    order: 48,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/dropdown-menu.tsx",
  },
  {
    slug: "components/popover",
    title: "Popover",
    description:
      "Floating panel displaying rich interactive content anchored to a trigger control.",
    category: "Components",
    order: 49,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/popover.tsx",
  },
  {
    slug: "components/progress",
    title: "Progress",
    description:
      "Horizontal progress bar displaying the completion status of long-running operations or simulations.",
    category: "Components",
    order: 50,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/progress.tsx",
  },
  {
    slug: "components/radio-group",
    title: "Radio Group",
    description: "A set of checkable buttons where only one button can be checked at a time.",
    category: "Components",
    order: 51,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/radio-group.tsx",
  },
  {
    slug: "components/separator",
    title: "Separator",
    description:
      "Visual or semantic horizontal/vertical dividers with restrained subtle borders (#1C1C1C).",
    category: "Components",
    order: 52,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/separator.tsx",
  },
  {
    slug: "components/sheet",
    title: "Sheet",
    description:
      "Extends dialog to produce side-docked drawers for mobile navigation and complex inspector panels.",
    category: "Components",
    order: 53,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/sheet.tsx",
  },
  {
    slug: "components/skeleton",
    title: "Skeleton",
    description:
      "Pulsing placeholder previews rendering layout structures during asynchronous network requests.",
    category: "Components",
    order: 54,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/skeleton.tsx",
  },
  {
    slug: "components/slider",
    title: "Slider",
    description:
      "Continuous or stepped range controls for numerical values like zoom levels and simulation speeds.",
    category: "Components",
    order: 55,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/slider.tsx",
  },
  {
    slug: "components/switch",
    title: "Switch",
    description: "Tactile toggle switch for immediate boolean settings and feature flags.",
    category: "Components",
    order: 56,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/switch.tsx",
  },
  {
    slug: "components/toggle",
    title: "Toggle",
    description:
      "Two-state pressed button for toggling states like grid snapping or inspector visibility.",
    category: "Components",
    order: 57,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/toggle.tsx",
  },
  {
    slug: "components/toggle-group",
    title: "Toggle Group",
    description:
      "Coordinated set of two-state toggle buttons for exclusive or multiple selection modes.",
    category: "Components",
    order: 58,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/toggle-group.tsx",
  },
  {
    slug: "components/tooltip",
    title: "Tooltip",
    description:
      "Compact hover popups explaining the function of toolbar buttons and icon controls.",
    category: "Components",
    order: 59,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/tooltip.tsx",
  },
  {
    slug: "components/kbd",
    title: "Kbd",
    description:
      "Monospaced keyboard shortcut badges displaying key combos like ⌘K, Shift+Enter, or Esc.",
    category: "Components",
    order: 60,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/kbd.tsx",
  },
  {
    slug: "components/calendar",
    title: "Calendar",
    description: "Date picker calendar surface with single, multiple, and range selection modes.",
    category: "Components",
    order: 61,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/calendar.tsx",
  },
  {
    slug: "components/date-picker",
    title: "Date Picker",
    description:
      "Popover date input for selecting single calendar timestamps with keyboard support.",
    category: "Components",
    order: 62,
    status: "ready",
    sourcePath: "packages/ui/src/components/composite/date-picker/date-picker.tsx",
  },
  {
    slug: "components/empty-state",
    title: "Empty State",
    description:
      "Placeholder presentation displayed when lists, graphs, or queries return zero results.",
    category: "Components",
    order: 63,
    status: "ready",
    sourcePath: "packages/ui/src/components/composite/empty-state/empty-state.tsx",
  },
  {
    slug: "components/search-field",
    title: "Search Field",
    description:
      "Specialized search input with debounced input, clear button, and filter shortcut affordances.",
    category: "Components",
    order: 64,
    status: "ready",
    sourcePath: "packages/ui/src/components/composite/search-field/search-field.tsx",
  },
  {
    slug: "components/filter-bar",
    title: "Filter Bar",
    description:
      "Composite filter toolbar combining search fields, multi-select badges, and reset actions.",
    category: "Components",
    order: 65,
    status: "ready",
    sourcePath: "packages/ui/src/components/composite/filter-bar/filter-bar.tsx",
  },
  {
    slug: "components/confirm-action",
    title: "Confirm Action",
    description:
      "Two-step confirmation button preventing accidental execution of destructive operations.",
    category: "Components",
    order: 66,
    status: "ready",
    sourcePath: "packages/ui/src/components/composite/confirm-action/confirm-action.tsx",
  },
  {
    slug: "components/settings-field",
    title: "Settings Field",
    description:
      "Standardized settings row pairing a label, description, and control widget with alignment.",
    category: "Components",
    order: 67,
    status: "ready",
    sourcePath: "packages/ui/src/components/composite/settings-field/settings-field.tsx",
  },
  {
    slug: "components/canvas-shell",
    title: "Canvas Shell",
    description:
      "The core layout container for interactive visualizers, isolating zooming/panning from panels.",
    category: "Components",
    order: 68,
    status: "ready",
    sourcePath: "packages/ui/src/components/visualization/canvas-shell.tsx",
  },

  // ==========================================
  // VISUALIZER (PREPARED CATEGORIES / DRAFT)
  // ==========================================
  {
    slug: "visualizer/canvas",
    title: "Graph Canvas",
    description:
      "The high-performance graph canvas powered by @xyflow/react with elkjs automated layout.",
    category: "Visualizer",
    order: 80,
    status: "draft",
  },
  {
    slug: "visualizer/nodes",
    title: "Graph Nodes",
    description:
      "Standardized discriminated union node types with handles, custom inspectors, and telemetry badges.",
    category: "Visualizer",
    order: 81,
    status: "draft",
  },
  {
    slug: "visualizer/edges",
    title: "Graph Edges",
    description:
      "Curved and orthogonal directional connectors carrying typed simulation data payloads.",
    category: "Visualizer",
    order: 82,
    status: "draft",
  },
  {
    slug: "visualizer/inspector",
    title: "Node Inspector",
    description:
      "Contextual floating properties inspector with container queries and overscroll containment.",
    category: "Visualizer",
    order: 83,
    status: "draft",
  },
  {
    slug: "visualizer/simulation-controls",
    title: "Simulation Controls",
    description: "Play, pause, step-forward, and scrub controls for deterministic trace execution.",
    category: "Visualizer",
    order: 84,
    status: "draft",
  },
  {
    slug: "visualizer/trace-viewer",
    title: "Execution Trace Viewer",
    description:
      "Sub-millisecond chronological event stream with filtering and error highlighting.",
    category: "Visualizer",
    order: 85,
    status: "draft",
  },
];

export function getDocEntryBySlug(slug: string): DocEntry | undefined {
  const normalized = slug.replace(/^\//, "").replace(/\/$/, "");
  return DOCS_REGISTRY.find((entry) => entry.slug === normalized);
}

export function getAdjacentDocs(slug: string): {
  prev?: DocEntry;
  next?: DocEntry;
} {
  const normalized = slug.replace(/^\//, "").replace(/\/$/, "");
  const index = DOCS_REGISTRY.findIndex((e) => e.slug === normalized);
  if (index === -1) return {};
  return {
    prev: index > 0 ? DOCS_REGISTRY[index - 1] : undefined,
    next: index < DOCS_REGISTRY.length - 1 ? DOCS_REGISTRY[index + 1] : undefined,
  };
}
