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
    slug: "getting-started/design-system",
    title: "Design System & Appearance",
    description:
      "Pure black monochrome foundations, solid neumorphic depth, Geist typography, and WCAG accessibility standards.",
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
    props: [
      {
        name: "className",
        type: "string",
        default: '""',
        required: false,
        description: "Additional CSS classes for custom padding or border styling.",
      },
    ],
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
    props: [
      {
        name: "rows",
        type: "number",
        default: "3",
        required: false,
        description: "Visible text rows.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        required: false,
        description: "Disables interaction.",
      },
    ],
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
    props: [
      {
        name: "open",
        type: "boolean",
        default: "undefined",
        required: false,
        description: "Controlled open state of the dialog.",
      },
      {
        name: "onOpenChange",
        type: "(open: boolean) => void",
        default: "undefined",
        required: false,
        description: "Callback invoked when open state changes.",
      },
    ],
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
    props: [
      {
        name: "value",
        type: "string",
        default: "undefined",
        required: false,
        description: "Controlled selected value.",
      },
      {
        name: "onValueChange",
        type: "(value: string) => void",
        default: "undefined",
        required: false,
        description: "Callback invoked when value changes.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        required: false,
        description: "Disables selector trigger.",
      },
    ],
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
    props: [
      {
        name: "value",
        type: "string",
        default: "undefined",
        required: false,
        description: "Controlled active tab key.",
      },
      {
        name: "defaultValue",
        type: "string",
        default: "undefined",
        required: false,
        description: "Initial active tab in uncontrolled mode.",
      },
      {
        name: "onValueChange",
        type: "(value: string) => void",
        default: "undefined",
        required: false,
        description: "Callback invoked when tab changes.",
      },
    ],
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
    props: [
      {
        name: "className",
        type: "string",
        default: '""',
        required: false,
        description: "Table root element styling.",
      },
    ],
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
    props: [
      {
        name: "columns",
        type: "ColumnDef<TData, TValue>[]",
        default: "[]",
        required: true,
        description: "TanStack column definitions and formatting schemas.",
      },
      {
        name: "data",
        type: "TData[]",
        default: "[]",
        required: true,
        description: "Row data array.",
      },
      {
        name: "pageSize",
        type: "number",
        default: "10",
        required: false,
        description: "Rows per paginated page.",
      },
    ],
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
    props: [
      {
        name: "value",
        type: "string",
        default: "undefined",
        required: false,
        description: "Controlled search filter query.",
      },
      {
        name: "onValueChange",
        type: "(search: string) => void",
        default: "undefined",
        required: false,
        description: "Callback invoked on input change.",
      },
    ],
  },
  {
    slug: "components/accordion",
    title: "Accordion",
    description: "Vertically stacked interactive disclosure headings with smooth expansion.",
    category: "Components",
    order: 42,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/accordion.tsx",
    props: [
      {
        name: "type",
        type: '"single" | "multiple"',
        default: '"single"',
        required: true,
        description: "Determines whether one or multiple items can be opened simultaneously.",
      },
      {
        name: "collapsible",
        type: "boolean",
        default: "false",
        required: false,
        description: "When type is 'single', allows closing an active item by clicking again.",
      },
    ],
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
    props: [
      {
        name: "variant",
        type: '"default" | "destructive" | "success" | "warning"',
        default: '"default"',
        required: false,
        description: "Visual status banner intent.",
      },
    ],
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
    props: [
      {
        name: "open",
        type: "boolean",
        default: "undefined",
        required: false,
        description: "Controlled open state.",
      },
      {
        name: "onOpenChange",
        type: "(open: boolean) => void",
        default: "undefined",
        required: false,
        description: "Callback invoked on modal open toggle.",
      },
    ],
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
    props: [
      {
        name: "className",
        type: "string",
        default: '""',
        required: false,
        description: "Avatar dimension and border overrides.",
      },
    ],
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
    props: [
      {
        name: "checked",
        type: 'boolean | "indeterminate"',
        default: "false",
        required: false,
        description: "Checked state.",
      },
      {
        name: "onCheckedChange",
        type: "(checked: boolean | 'indeterminate') => void",
        default: "undefined",
        required: false,
        description: "State change listener.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        required: false,
        description: "Disables interaction.",
      },
    ],
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
    props: [
      {
        name: "open",
        type: "boolean",
        default: "undefined",
        required: false,
        description: "Controlled open state.",
      },
      {
        name: "onOpenChange",
        type: "(open: boolean) => void",
        default: "undefined",
        required: false,
        description: "Event handler on change.",
      },
    ],
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
    props: [
      {
        name: "open",
        type: "boolean",
        default: "undefined",
        required: false,
        description: "Controlled menu open status.",
      },
      {
        name: "onOpenChange",
        type: "(open: boolean) => void",
        default: "undefined",
        required: false,
        description: "Open status change callback.",
      },
    ],
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
    props: [
      {
        name: "open",
        type: "boolean",
        default: "undefined",
        required: false,
        description: "Controlled popover open status.",
      },
      {
        name: "onOpenChange",
        type: "(open: boolean) => void",
        default: "undefined",
        required: false,
        description: "Callback on state change.",
      },
    ],
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
    props: [
      {
        name: "value",
        type: "number",
        default: "0",
        required: false,
        description: "Current progress value between 0 and 100.",
      },
      {
        name: "max",
        type: "number",
        default: "100",
        required: false,
        description: "Upper bound scalar.",
      },
    ],
  },
  {
    slug: "components/radio-group",
    title: "Radio Group",
    description: "A set of checkable buttons where only one button can be checked at a time.",
    category: "Components",
    order: 51,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/radio-group.tsx",
    props: [
      {
        name: "value",
        type: "string",
        default: "undefined",
        required: false,
        description: "Selected radio value.",
      },
      {
        name: "onValueChange",
        type: "(value: string) => void",
        default: "undefined",
        required: false,
        description: "Value selection callback.",
      },
    ],
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
    props: [
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        required: false,
        description: "Axis orientation of the rule.",
      },
      {
        name: "decorative",
        type: "boolean",
        default: "true",
        required: false,
        description: "Whether the element is purely decorative (aria-hidden).",
      },
    ],
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
    props: [
      {
        name: "side",
        type: '"top" | "right" | "bottom" | "left"',
        default: '"right"',
        required: false,
        description: "Edge from which the drawer animates.",
      },
      {
        name: "open",
        type: "boolean",
        default: "undefined",
        required: false,
        description: "Controlled open state.",
      },
    ],
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
    props: [
      {
        name: "className",
        type: "string",
        default: '""',
        required: false,
        description: "Width, height, and border radius shaping classes.",
      },
    ],
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
    props: [
      {
        name: "value",
        type: "number[]",
        default: "undefined",
        required: false,
        description: "Current slider value array.",
      },
      {
        name: "min",
        type: "number",
        default: "0",
        required: false,
        description: "Minimum scale value.",
      },
      {
        name: "max",
        type: "number",
        default: "100",
        required: false,
        description: "Maximum scale value.",
      },
      {
        name: "step",
        type: "number",
        default: "1",
        required: false,
        description: "Granular step size.",
      },
      {
        name: "onValueChange",
        type: "(value: number[]) => void",
        default: "undefined",
        required: false,
        description: "Value drag and keydown listener.",
      },
    ],
  },
  {
    slug: "components/switch",
    title: "Switch",
    description: "Tactile toggle switch for immediate boolean settings and feature flags.",
    category: "Components",
    order: 56,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/switch.tsx",
    props: [
      {
        name: "checked",
        type: "boolean",
        default: "false",
        required: false,
        description: "Boolean checked state.",
      },
      {
        name: "onCheckedChange",
        type: "(checked: boolean) => void",
        default: "undefined",
        required: false,
        description: "Toggle callback.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        required: false,
        description: "Disables interaction.",
      },
    ],
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
    props: [
      {
        name: "pressed",
        type: "boolean",
        default: "false",
        required: false,
        description: "Two-state pressed condition.",
      },
      {
        name: "onPressedChange",
        type: "(pressed: boolean) => void",
        default: "undefined",
        required: false,
        description: "Pressed callback listener.",
      },
      {
        name: "variant",
        type: '"default" | "outline"',
        default: '"default"',
        required: false,
        description: "Visual surface style.",
      },
    ],
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
    props: [
      {
        name: "type",
        type: '"single" | "multiple"',
        default: '"single"',
        required: true,
        description: "Whether one or several items can be simultaneously active.",
      },
      {
        name: "value",
        type: "string | string[]",
        default: "undefined",
        required: false,
        description: "Active toggle values.",
      },
      {
        name: "onValueChange",
        type: "(value: string | string[]) => void",
        default: "undefined",
        required: false,
        description: "Value change listener.",
      },
    ],
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
    props: [
      {
        name: "delayDuration",
        type: "number",
        default: "200",
        required: false,
        description: "Hover delay before popping open in milliseconds.",
      },
    ],
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
    props: [
      {
        name: "className",
        type: "string",
        default: '""',
        required: false,
        description: "Custom styling or font sizing.",
      },
    ],
  },
  {
    slug: "components/calendar",
    title: "Calendar",
    description: "Date picker calendar surface with single, multiple, and range selection modes.",
    category: "Components",
    order: 61,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/calendar.tsx",
    props: [
      {
        name: "mode",
        type: '"single" | "multiple" | "range"',
        default: '"single"',
        required: false,
        description: "Selection mode.",
      },
      {
        name: "selected",
        type: "Date | Date[] | DateRange | undefined",
        default: "undefined",
        required: false,
        description: "Selected date value.",
      },
      {
        name: "onSelect",
        type: "(date: any) => void",
        default: "undefined",
        required: false,
        description: "Date selection callback.",
      },
    ],
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
    props: [
      {
        name: "value",
        type: "Date | null",
        default: "null",
        required: false,
        description: "Controlled selected Date object.",
      },
      {
        name: "onChange",
        type: "(date: Date | null) => void",
        default: "undefined",
        required: false,
        description: "Date update listener.",
      },
      {
        name: "placeholder",
        type: "string",
        default: '"Pick a date"',
        required: false,
        description: "Trigger placeholder label.",
      },
    ],
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
    props: [
      {
        name: "title",
        type: "string",
        default: '""',
        required: true,
        description: "Primary empty heading.",
      },
      {
        name: "description",
        type: "string",
        default: '""',
        required: false,
        description: "Descriptive context or instructions.",
      },
      {
        name: "icon",
        type: "React.ComponentType<{ className?: string }>",
        default: "undefined",
        required: false,
        description: "Icon element placed above the title.",
      },
      {
        name: "action",
        type: "React.ReactNode",
        default: "undefined",
        required: false,
        description: "Action button or CTA trigger.",
      },
    ],
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
    props: [
      {
        name: "value",
        type: "string",
        default: '""',
        required: true,
        description: "Controlled search query string.",
      },
      {
        name: "onChange",
        type: "(value: string) => void",
        default: "undefined",
        required: true,
        description: "Search input change listener.",
      },
      {
        name: "onClear",
        type: "() => void",
        default: "undefined",
        required: false,
        description: "Clear button click listener.",
      },
    ],
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
    props: [
      {
        name: "filters",
        type: "ActiveFilter[]",
        default: "[]",
        required: true,
        description: "List of active filter pills to render.",
      },
      {
        name: "onRemove",
        type: "(id: string) => void",
        default: "undefined",
        required: true,
        description: "Remove individual filter pill listener.",
      },
      {
        name: "onClearAll",
        type: "() => void",
        default: "undefined",
        required: true,
        description: "Clear all filters callback.",
      },
    ],
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
    props: [
      {
        name: "trigger",
        type: "React.ReactNode",
        default: "undefined",
        required: true,
        description: "Trigger element to mount.",
      },
      {
        name: "title",
        type: "string",
        default: '""',
        required: true,
        description: "Confirmation dialog heading.",
      },
      {
        name: "description",
        type: "string",
        default: '""',
        required: true,
        description: "Explanation of destructive impact.",
      },
      {
        name: "onConfirm",
        type: "() => void",
        default: "undefined",
        required: true,
        description: "Action callback on confirmation.",
      },
    ],
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
    props: [
      {
        name: "label",
        type: "string",
        default: '""',
        required: true,
        description: "Label text for the control.",
      },
      {
        name: "description",
        type: "string",
        default: '""',
        required: false,
        description: "Secondary helper text.",
      },
      {
        name: "children",
        type: "React.ReactNode",
        default: "undefined",
        required: true,
        description: "Control input or switch widget.",
      },
    ],
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
    props: [
      {
        name: "toolbar",
        type: "React.ReactNode",
        default: "undefined",
        required: false,
        description: "Top floating toolbar slot.",
      },
      {
        name: "sidebar",
        type: "React.ReactNode",
        default: "undefined",
        required: false,
        description: "Left/right docking inspector slot.",
      },
      {
        name: "children",
        type: "React.ReactNode",
        default: "undefined",
        required: true,
        description: "Graph canvas viewport.",
      },
    ],
  },
  {
    slug: "components/breadcrumb",
    title: "Breadcrumb",
    description: "Semantic navigational breadcrumbs adhering to WAI-ARIA breadcrumb design patterns.",
    category: "Components",
    order: 69,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/breadcrumb.tsx",
    props: [
      {
        name: "separator",
        type: "React.ReactNode",
        default: '"/"',
        required: false,
        description: "Custom delimiter icon between hierarchy items.",
      },
    ],
  },
  {
    slug: "components/navigation-menu",
    title: "Navigation Menu",
    description: "Enterprise top-level navigation hierarchy with interactive dropdown viewport panels.",
    category: "Components",
    order: 70,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/navigation-menu.tsx",
    props: [
      {
        name: "value",
        type: "string",
        default: "undefined",
        required: false,
        description: "Active menu trigger key in controlled mode.",
      },
      {
        name: "onValueChange",
        type: "(value: string) => void",
        default: "undefined",
        required: false,
        description: "State change listener.",
      },
    ],
  },
  {
    slug: "components/menubar",
    title: "Menubar",
    description: "Desktop-grade application menubar with keyboard shortcuts and cascading submenus.",
    category: "Components",
    order: 71,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/menubar.tsx",
    props: [
      {
        name: "value",
        type: "string",
        default: "undefined",
        required: false,
        description: "Active menu identifier.",
      },
    ],
  },
  {
    slug: "components/pagination",
    title: "Pagination",
    description: "Navigation controls for paginating large data streams with accessible previous and next actions.",
    category: "Components",
    order: 72,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/pagination.tsx",
    props: [
      {
        name: "className",
        type: "string",
        default: '""',
        required: false,
        description: "Pagination bar styling.",
      },
    ],
  },
  {
    slug: "components/sonner",
    title: "Sonner",
    description: "High-performance toast notifications powered by Sonner with custom solid neumorphic styling.",
    category: "Components",
    order: 73,
    status: "ready",
    sourcePath: "packages/ui/src/components/ui/sonner.tsx",
    props: [
      {
        name: "theme",
        type: '"dark" | "light" | "system"',
        default: '"dark"',
        required: false,
        description: "Color theme for toast notifications.",
      },
      {
        name: "position",
        type: '"top-left" | "top-right" | "bottom-left" | "bottom-right"',
        default: '"bottom-right"',
        required: false,
        description: "Screen viewport dock location.",
      },
    ],
  },

  // ==========================================
  // VISUALIZER (PRODUCTION IMPLEMENTATIONS / READY)
  // ==========================================
  {
    slug: "visualizer/canvas",
    title: "Graph Canvas",
    description:
      "The high-performance graph canvas powered by @xyflow/react with elkjs automated layout.",
    category: "Visualizer",
    order: 80,
    status: "ready",
  },
  {
    slug: "visualizer/nodes",
    title: "Graph Nodes",
    description:
      "Standardized discriminated union node types with handles, custom inspectors, and telemetry badges.",
    category: "Visualizer",
    order: 81,
    status: "ready",
  },
  {
    slug: "visualizer/edges",
    title: "Graph Edges",
    description:
      "Curved and orthogonal directional connectors carrying typed simulation data payloads.",
    category: "Visualizer",
    order: 82,
    status: "ready",
  },
  {
    slug: "visualizer/inspector",
    title: "Node Inspector",
    description:
      "Contextual floating properties inspector with container queries and overscroll containment.",
    category: "Visualizer",
    order: 83,
    status: "ready",
  },
  {
    slug: "visualizer/simulation-controls",
    title: "Simulation Controls",
    description: "Play, pause, step-forward, and scrub controls for deterministic trace execution.",
    category: "Visualizer",
    order: 84,
    status: "ready",
  },
  {
    slug: "visualizer/trace-viewer",
    title: "Execution Trace Viewer",
    description:
      "Sub-millisecond chronological event stream with filtering and error highlighting.",
    category: "Visualizer",
    order: 85,
    status: "ready",
  },
  {
    slug: "visualizer/execution-trace",
    title: "Execution Trace Viewer",
    description:
      "Sub-millisecond chronological event stream with filtering and error highlighting.",
    category: "Visualizer",
    order: 86,
    status: "ready",
  },
];

export function getDocEntryBySlug(slug: string): DocEntry | undefined {
  let normalized = slug.replace(/^\//, "").replace(/\/$/, "");
  if (normalized === "getting-started/theming") {
    normalized = "getting-started/design-system";
  }
  return DOCS_REGISTRY.find((entry) => entry.slug === normalized);
}

export function getAdjacentDocs(slug: string): {
  prev?: DocEntry;
  next?: DocEntry;
} {
  let normalized = slug.replace(/^\//, "").replace(/\/$/, "");
  if (normalized === "getting-started/theming") {
    normalized = "getting-started/design-system";
  }
  const index = DOCS_REGISTRY.findIndex((e) => e.slug === normalized);
  if (index === -1) return {};
  return {
    prev: index > 0 ? DOCS_REGISTRY[index - 1] : undefined,
    next: index < DOCS_REGISTRY.length - 1 ? DOCS_REGISTRY[index + 1] : undefined,
  };
}
