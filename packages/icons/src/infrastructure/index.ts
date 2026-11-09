export * from "./types";
export * from "./clients";
export * from "./dns-cdn-edge";
export * from "./networking-and-traffic";
export * from "./compute-and-application-services";

import type { InfrastructureIconComponent } from "./types";
import { clientIconRegistry } from "./clients";
import { dnsCdnEdgeIconRegistry } from "./dns-cdn-edge";
import { networkingAndTrafficIconRegistry } from "./networking-and-traffic";
import { computeAndApplicationServicesIconRegistry } from "./compute-and-application-services";

export const allInfrastructureIconRegistry: Record<string, InfrastructureIconComponent> = {
  ...clientIconRegistry,
  ...dnsCdnEdgeIconRegistry,
  ...networkingAndTrafficIconRegistry,
  ...computeAndApplicationServicesIconRegistry,
};

export function getInfrastructureIcon(slug: string): InfrastructureIconComponent | undefined {
  return allInfrastructureIconRegistry[slug];
}

