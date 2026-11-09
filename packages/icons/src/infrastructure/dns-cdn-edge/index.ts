export * from "./dns-resolver-icon";
export * from "./authoritative-dns-icon";
export * from "./dns-load-balancing-icon";
export * from "./cdn-icon";
export * from "./edge-cache-icon";
export * from "./edge-worker-icon";
export * from "./edge-router-icon";
export * from "./reverse-proxy-icon";
export * from "./global-traffic-manager-icon";
export * from "./anycast-network-icon";

import type { InfrastructureIconComponent } from "../types";
import { DnsResolverIcon } from "./dns-resolver-icon";
import { AuthoritativeDnsIcon } from "./authoritative-dns-icon";
import { DnsLoadBalancingIcon } from "./dns-load-balancing-icon";
import { CdnIcon } from "./cdn-icon";
import { EdgeCacheIcon } from "./edge-cache-icon";
import { EdgeWorkerIcon } from "./edge-worker-icon";
import { EdgeRouterIcon } from "./edge-router-icon";
import { ReverseProxyIcon } from "./reverse-proxy-icon";
import { GlobalTrafficManagerIcon } from "./global-traffic-manager-icon";
import { AnycastNetworkIcon } from "./anycast-network-icon";

export const dnsCdnEdgeIconRegistry: Record<string, InfrastructureIconComponent> = {
  "dns-resolver": DnsResolverIcon,
  "authoritative-dns": AuthoritativeDnsIcon,
  "dns-load-balancing": DnsLoadBalancingIcon,
  cdn: CdnIcon,
  "edge-cache": EdgeCacheIcon,
  "edge-worker": EdgeWorkerIcon,
  "edge-router": EdgeRouterIcon,
  "reverse-proxy": ReverseProxyIcon,
  "global-traffic-manager": GlobalTrafficManagerIcon,
  "anycast-network": AnycastNetworkIcon,
};

export function getDnsCdnEdgeInfrastructureIcon(
  slug: string
): InfrastructureIconComponent | undefined {
  return dnsCdnEdgeIconRegistry[slug];
}
