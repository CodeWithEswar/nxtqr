export * from "./types";
export * from "./clients";
export * from "./dns-cdn-edge";

import type { InfrastructureIconComponent } from "./types";
import { clientIconRegistry } from "./clients";
import { dnsCdnEdgeIconRegistry } from "./dns-cdn-edge";

export const allInfrastructureIconRegistry: Record<string, InfrastructureIconComponent> = {
  ...clientIconRegistry,
  ...dnsCdnEdgeIconRegistry,
};

export function getInfrastructureIcon(slug: string): InfrastructureIconComponent | undefined {
  return allInfrastructureIconRegistry[slug];
}
