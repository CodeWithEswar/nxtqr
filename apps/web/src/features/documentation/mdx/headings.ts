import type { DocHeading } from "../schemas/docs-schema";

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractHeadingsFromMarkdown(content: string): DocHeading[] {
  const headings: DocHeading[] = [];
  const lines = content.split("\n");
  const seenIds = new Map<string, number>();

  for (const line of lines) {
    const trimmed = line.trim();
    const h2Match = trimmed.match(/^##\s+(.+)$/);
    const h3Match = trimmed.match(/^###\s+(.+)$/);

    if (h2Match) {
      const rawTitle = h2Match[1].trim();
      const baseId = slugifyHeading(rawTitle);
      const count = seenIds.get(baseId) ?? 0;
      seenIds.set(baseId, count + 1);
      const id = count === 0 ? baseId : `${baseId}-${count}`;

      headings.push({
        id,
        title: rawTitle.replace(/`([^`]+)`/g, "$1"),
        level: 2,
      });
    } else if (h3Match) {
      const rawTitle = h3Match[1].trim();
      const baseId = slugifyHeading(rawTitle);
      const count = seenIds.get(baseId) ?? 0;
      seenIds.set(baseId, count + 1);
      const id = count === 0 ? baseId : `${baseId}-${count}`;

      headings.push({
        id,
        title: rawTitle.replace(/`([^`]+)`/g, "$1"),
        level: 3,
      });
    }
  }

  return headings;
}
