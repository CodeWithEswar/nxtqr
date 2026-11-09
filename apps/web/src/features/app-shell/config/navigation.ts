import type { IconComponent } from "@nxtqr/icons";
import {
  GridIcon,
  FolderIcon,
  SlidersIcon,
  CheckCircleIcon,
  BookOpenIcon,
  SettingsIcon,
} from "@nxtqr/icons";

export interface NavigationItem {
  id: string;
  label: string;
  shortLabel?: string;
  href: string;
  icon: IconComponent;
  disabled?: boolean;
  badge?: string;
  external?: boolean;
  description?: string;
}

export interface NavigationGroup {
  id: string;
  label: string;
  items: NavigationItem[];
}

/**
 * Single authoritative navigation registry for the NXTQR Application Shell.
 * Reused identically by:
 * - Desktop resizable sidebar
 * - Mobile navigation drawer (Sheet)
 * - Global command palette
 */
export const SHELL_NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        id: "overview",
        label: "Overview",
        shortLabel: "Overview",
        href: "/workspace",
        icon: GridIcon,
        description: "Studio workspace, telemetry overview, and active canvas",
      },
      {
        id: "projects",
        label: "Projects",
        shortLabel: "Projects",
        href: "/workspace/projects",
        icon: FolderIcon,
        description: "Workspace architectures, diagrams, and persistent graphs",
      },
      {
        id: "visualizers",
        label: "Visualizers",
        shortLabel: "Visualizers",
        href: "/workspace/visualizers",
        icon: SlidersIcon,
        description: "Domain-specific visualizer feature modules",
      },
      {
        id: "review-gates",
        label: "Review Gates",
        shortLabel: "Gates",
        href: "/verify",
        icon: CheckCircleIcon,
        description: "Production verification console and design system audits",
      },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    items: [
      {
        id: "documentation",
        label: "Documentation",
        shortLabel: "Docs",
        href: "/docs",
        icon: BookOpenIcon,
        description: "Interactive engineering guides, specs, and API contracts",
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      {
        id: "settings",
        label: "Appearance & Tokens",
        shortLabel: "Settings",
        href: "/settings/theme",
        icon: SettingsIcon,
        description: "Pure black monochrome standard and token constraints",
      },
    ],
  },
];

/**
 * Flattens all navigation items for fast lookup and command palette registration.
 */
export const ALL_NAVIGATION_ITEMS: NavigationItem[] = SHELL_NAVIGATION_GROUPS.flatMap(
  (group) => group.items
);

/**
 * Matches an active item based on current pathname.
 */
export function matchActiveNavigationItem(
  pathname: string,
  items: NavigationItem[] = ALL_NAVIGATION_ITEMS
): NavigationItem | undefined {
  if (!pathname) return undefined;

  // Exact match first
  const exact = items.find((item) => item.href === pathname);
  if (exact) return exact;

  // Prefix match (for nested routes, excluding root or /docs when browsing deeper docs)
  return items.find(
    (item) => item.href !== "/" && pathname.startsWith(item.href)
  );
}

