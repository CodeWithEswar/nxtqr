export * from "./cloud-region-icon";
export * from "./availability-zone-icon";
export * from "./compute-instance-icon";
export * from "./managed-database-icon";
export * from "./managed-kubernetes-icon";
export * from "./managed-queue-icon";
export * from "./managed-cache-icon";
export * from "./cloud-function-icon";
export * from "./cloud-storage-bucket-icon";
export * from "./cloud-load-balancer-icon";
export * from "./cloud-network-icon";
export * from "./cloud-iam-icon";

import type { InfrastructureIconComponent } from "../types";
import { CloudRegionIcon } from "./cloud-region-icon";
import { AvailabilityZoneIcon } from "./availability-zone-icon";
import { ComputeInstanceIcon } from "./compute-instance-icon";
import { ManagedDatabaseIcon } from "./managed-database-icon";
import { ManagedKubernetesIcon } from "./managed-kubernetes-icon";
import { ManagedQueueIcon } from "./managed-queue-icon";
import { ManagedCacheIcon } from "./managed-cache-icon";
import { CloudFunctionIcon } from "./cloud-function-icon";
import { CloudStorageBucketIcon } from "./cloud-storage-bucket-icon";
import { CloudLoadBalancerIcon } from "./cloud-load-balancer-icon";
import { CloudNetworkIcon } from "./cloud-network-icon";
import { CloudIamIcon } from "./cloud-iam-icon";

export const cloudInfrastructureIconRegistry: Record<string, InfrastructureIconComponent> = {
  "cloud-region": CloudRegionIcon,
  "availability-zone": AvailabilityZoneIcon,
  "compute-instance": ComputeInstanceIcon,
  "managed-database": ManagedDatabaseIcon,
  "managed-kubernetes": ManagedKubernetesIcon,
  "managed-queue": ManagedQueueIcon,
  "managed-cache": ManagedCacheIcon,
  "cloud-function": CloudFunctionIcon,
  "cloud-storage-bucket": CloudStorageBucketIcon,
  "cloud-load-balancer": CloudLoadBalancerIcon,
  "cloud-network": CloudNetworkIcon,
  "cloud-iam": CloudIamIcon,
};

export function getCloudInfrastructureIcon(
  slug: string
): InfrastructureIconComponent | undefined {
  return cloudInfrastructureIconRegistry[slug];
}

