import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  CloudRegionIcon,
  AvailabilityZoneIcon,
  ComputeInstanceIcon,
  ManagedDatabaseIcon,
  ManagedKubernetesIcon,
  ManagedQueueIcon,
  ManagedCacheIcon,
  CloudFunctionIcon,
  CloudStorageBucketIcon,
  CloudLoadBalancerIcon,
  CloudNetworkIcon,
  CloudIamIcon,
  cloudInfrastructureIconRegistry,
  getCloudInfrastructureIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_16_ICONS = [
  { slug: "cloud-region", name: "CloudRegionIcon", Component: CloudRegionIcon },
  { slug: "availability-zone", name: "AvailabilityZoneIcon", Component: AvailabilityZoneIcon },
  { slug: "compute-instance", name: "ComputeInstanceIcon", Component: ComputeInstanceIcon },
  { slug: "managed-database", name: "ManagedDatabaseIcon", Component: ManagedDatabaseIcon },
  { slug: "managed-kubernetes", name: "ManagedKubernetesIcon", Component: ManagedKubernetesIcon },
  { slug: "managed-queue", name: "ManagedQueueIcon", Component: ManagedQueueIcon },
  { slug: "managed-cache", name: "ManagedCacheIcon", Component: ManagedCacheIcon },
  { slug: "cloud-function", name: "CloudFunctionIcon", Component: CloudFunctionIcon },
  { slug: "cloud-storage-bucket", name: "CloudStorageBucketIcon", Component: CloudStorageBucketIcon },
  { slug: "cloud-load-balancer", name: "CloudLoadBalancerIcon", Component: CloudLoadBalancerIcon },
  { slug: "cloud-network", name: "CloudNetworkIcon", Component: CloudNetworkIcon },
  { slug: "cloud-iam", name: "CloudIamIcon", Component: CloudIamIcon },
] as const;

describe("Category 16 — Cloud Infrastructure Icons", () => {
  it("renders all 12 icons in colored mode with 32x32 viewBox", () => {
    expect(ALL_CATEGORY_16_ICONS).toHaveLength(12);

    for (const { slug, name, Component } of ALL_CATEGORY_16_ICONS) {
      const html = renderToString(<Component size={32} variant="colored" />);
      expect(html, `Icon "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('viewBox="0 0 32 32"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
    }
  });

  it("renders all 12 icons in monochrome mode with accessible titles", () => {
    for (const { name, Component } of ALL_CATEGORY_16_ICONS) {
      const html = renderToString(
        <Component size={24} variant="monochrome" decorative={false} title={name} />
      );
      expect(html).toContain("<svg");
      expect(html).toContain("<title>");
      expect(html).toContain(name);
      expect(html).toContain('role="img"');
    }
  });

  it("registers all 12 icons in cloudInfrastructureIconRegistry and allInfrastructureIconRegistry", () => {
    expect(Object.keys(cloudInfrastructureIconRegistry)).toHaveLength(12);

    for (const { slug, Component } of ALL_CATEGORY_16_ICONS) {
      expect(cloudInfrastructureIconRegistry[slug]).toBe(Component);
      expect(getCloudInfrastructureIcon(slug)).toBe(Component);
      expect(getInfrastructureIcon(slug)).toBe(Component);
    }
  });
});
