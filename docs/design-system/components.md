# Component System Documentation

## Primitives (`@nxtqr/ui`)

Built on top of Radix UI primitives and styled with Tailwind CSS conforming to pure black monochrome and `rounded-md`:

- `Button`: Primary, secondary, outline, destructive, ghost, link variants; supports loading state with spinner.
- `Badge`: Compact status pills in default accent, secondary, destructive, outline, muted.
- `Card`: Developer-styled panel containers with subtle `#262626` borders.
- `Input` & `Textarea`: Precise 8px height inputs with focus rings.
- `Dialog` & `AlertDialog`: Modal dialogue shells with accessible backdrop blur and keyboard dismissal.
- `Sheet`: Slide-out inspector panels for node details and mobile toolbars.
- `Popover` & `Tooltip`: Non-modal floating overlays.
- `Tabs`: Segmented navigation pills with animated active states.
- `Table`: Dense data display with hover row highlighting.
- `Select`, `Checkbox`, `Switch`, `Slider`, `Progress`, `ScrollArea`: Standard form primitives.

## Composite Components

- `DataTable`: TanStack Table integration with pagination, sorting, search, and loading skeletons.
- `DatePicker` & `DateRangePicker`: Calendar popovers for date constraints.
- `SearchField`: Accessible search input with clear button.
- `FilterBar`: Active filter chips with clear-all triggers.
- `ConfirmAction`: Destructive confirmation dialogue wrapper.
- `SettingsField`: Row layout for preference panels.
- `EmptyState`: Restrained empty state with icon, title, description, and action button.
