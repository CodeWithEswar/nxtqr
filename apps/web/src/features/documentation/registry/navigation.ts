import { DOCS_REGISTRY } from "./docs-registry";

export interface NavItem {
  slug: string;
  title: string;
  status: "ready" | "draft";
}

export interface NavGroup {
  category: string;
  items: NavItem[];
}

export function getDocsNavigation(): NavGroup[] {
  const categoryOrder = ["Getting Started", "Foundations", "Components", "Visualizer"];
  const groups: NavGroup[] = [];

  for (const cat of categoryOrder) {
    const items = DOCS_REGISTRY.filter((entry) => entry.category === cat)
      .sort((a, b) => a.order - b.order)
      .map((entry) => ({
        slug: entry.slug,
        title: entry.title,
        status: entry.status,
      }));

    if (items.length > 0) {
      groups.push({
        category: cat,
        items,
      });
    }
  }

  return groups;
}
