import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  ObjectStorageIcon,
  BlockStorageIcon,
  FileStorageIcon,
  DistributedFileSystemIcon,
  BlobStorageIcon,
  MediaStorageIcon,
  BackupStorageIcon,
  ArchiveStorageIcon,
  StorageGatewayIcon,
  ContentRepositoryIcon,
  storageAndFileSystemsIconRegistry,
  getStorageAndFileSystemsInfrastructureIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_08_ICONS = [
  { slug: "object-storage", name: "ObjectStorageIcon", Component: ObjectStorageIcon },
  { slug: "block-storage", name: "BlockStorageIcon", Component: BlockStorageIcon },
  { slug: "file-storage", name: "FileStorageIcon", Component: FileStorageIcon },
  { slug: "distributed-file-system", name: "DistributedFileSystemIcon", Component: DistributedFileSystemIcon },
  { slug: "blob-storage", name: "BlobStorageIcon", Component: BlobStorageIcon },
  { slug: "media-storage", name: "MediaStorageIcon", Component: MediaStorageIcon },
  { slug: "backup-storage", name: "BackupStorageIcon", Component: BackupStorageIcon },
  { slug: "archive-storage", name: "ArchiveStorageIcon", Component: ArchiveStorageIcon },
  { slug: "storage-gateway", name: "StorageGatewayIcon", Component: StorageGatewayIcon },
  { slug: "content-repository", name: "ContentRepositoryIcon", Component: ContentRepositoryIcon },
] as const;

describe("Category 08 — Storage & File Systems Infrastructure Icons", () => {
  it("renders all 10 icons in colored mode with 32x32 viewBox", () => {
    expect(ALL_CATEGORY_08_ICONS).toHaveLength(10);

    for (const { slug, name, Component } of ALL_CATEGORY_08_ICONS) {
      const html = renderToString(<Component size={32} variant="colored" />);
      expect(html, `Icon "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('viewBox="0 0 32 32"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
    }
  });

  it("renders all 10 icons in monochrome mode with accessible titles", () => {
    for (const { name, Component } of ALL_CATEGORY_08_ICONS) {
      const html = renderToString(
        <Component size={24} variant="monochrome" decorative={false} title={name} />
      );
      expect(html).toContain("<svg");
      expect(html).toContain(`<title>${name}</title>`);
      expect(html).toContain('role="img"');
      expect(html).not.toContain('aria-hidden="true"');
    }
  });

  it("resolves all 10 icons from the storageAndFileSystemsIconRegistry and getInfrastructureIcon", () => {
    for (const { slug, Component } of ALL_CATEGORY_08_ICONS) {
      const registryComp = storageAndFileSystemsIconRegistry[slug];
      expect(registryComp).toBe(Component);

      const getterComp = getStorageAndFileSystemsInfrastructureIcon(slug);
      expect(getterComp).toBe(Component);

      const globalComp = getInfrastructureIcon(slug);
      expect(globalComp).toBe(Component);
    }
  });

  it("scales correctly across standard infrastructure sizes", () => {
    const sizes = [16, 20, 24, 32, 48] as const;
    for (const size of sizes) {
      const html = renderToString(<ObjectStorageIcon size={size} />);
      expect(html).toContain(`width="${size}"`);
      expect(html).toContain(`height="${size}"`);
    }
  });
});
