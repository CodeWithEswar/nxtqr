export * from "./types";
export * from "./clients";
export * from "./dns-cdn-edge";
export * from "./networking-and-traffic";
export * from "./compute-and-application-services";
export * from "./databases-and-persistence";
export * from "./caching-and-performance";
export * from "./messaging-and-event-systems";
export * from "./storage-and-file-systems";
export * from "./security-and-identity";
export * from "./observability-and-reliability";
export * from "./search-and-discovery";
export * from "./data-engineering-and-analytics";

import type { InfrastructureIconComponent } from "./types";
import { clientIconRegistry } from "./clients";
import { dnsCdnEdgeIconRegistry } from "./dns-cdn-edge";
import { networkingAndTrafficIconRegistry } from "./networking-and-traffic";
import { computeAndApplicationServicesIconRegistry } from "./compute-and-application-services";
import { databasesAndPersistenceIconRegistry } from "./databases-and-persistence";
import { cachingAndPerformanceIconRegistry } from "./caching-and-performance";
import { messagingAndEventSystemsIconRegistry } from "./messaging-and-event-systems";
import { storageAndFileSystemsIconRegistry } from "./storage-and-file-systems";
import { securityAndIdentityIconRegistry } from "./security-and-identity";
import { observabilityAndReliabilityIconRegistry } from "./observability-and-reliability";
import { searchAndDiscoveryIconRegistry } from "./search-and-discovery";
import { dataEngineeringAndAnalyticsIconRegistry } from "./data-engineering-and-analytics";

export const allInfrastructureIconRegistry: Record<string, InfrastructureIconComponent> = {
  ...clientIconRegistry,
  ...dnsCdnEdgeIconRegistry,
  ...networkingAndTrafficIconRegistry,
  ...computeAndApplicationServicesIconRegistry,
  ...databasesAndPersistenceIconRegistry,
  ...cachingAndPerformanceIconRegistry,
  ...messagingAndEventSystemsIconRegistry,
  ...storageAndFileSystemsIconRegistry,
  ...securityAndIdentityIconRegistry,
  ...observabilityAndReliabilityIconRegistry,
  ...searchAndDiscoveryIconRegistry,
  ...dataEngineeringAndAnalyticsIconRegistry,
};

export function getInfrastructureIcon(slug: string): InfrastructureIconComponent | undefined {
  return allInfrastructureIconRegistry[slug];
}
