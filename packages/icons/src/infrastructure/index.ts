export * from "./types";
export * from "./clients";
export * from "./dns-cdn-edge";
export * from "./networking-and-traffic";

import type { InfrastructureIconComponent } from "./types";
import { clientIconRegistry } from "./clients";
import { dnsCdnEdgeIconRegistry } from "./dns-cdn-edge";
import { networkingAndTrafficIconRegistry } from "./networking-and-traffic";

export const allInfrastructureIconRegistry: Record<string, InfrastructureIconComponent> = {
  ...clientIconRegistry,
  ...dnsCdnEdgeIconRegistry,
  ...networkingAndTrafficIconRegistry,
};

export function getInfrastructureIcon(slug: string): InfrastructureIconComponent | undefined {
  return allInfrastructureIconRegistry[slug];
}
