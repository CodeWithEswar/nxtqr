import type { InfrastructureIconComponent } from "../types";
import { LoadBalancerIcon } from "./load-balancer-icon";
import { Layer4LoadBalancerIcon } from "./layer-4-load-balancer-icon";
import { Layer7LoadBalancerIcon } from "./layer-7-load-balancer-icon";
import { ApiGatewayIcon } from "./api-gateway-icon";
import { IngressControllerIcon } from "./ingress-controller-icon";
import { ForwardProxyIcon } from "./forward-proxy-icon";
import { NatGatewayIcon } from "./nat-gateway-icon";
import { VpcIcon } from "./vpc-icon";
import { SubnetIcon } from "./subnet-icon";
import { ServiceDiscoveryIcon } from "./service-discovery-icon";
import { ServiceMeshIcon } from "./service-mesh-icon";
import { NetworkFirewallIcon } from "./network-firewall-icon";

export {
  LoadBalancerIcon,
  Layer4LoadBalancerIcon,
  Layer7LoadBalancerIcon,
  ApiGatewayIcon,
  IngressControllerIcon,
  ForwardProxyIcon,
  NatGatewayIcon,
  VpcIcon,
  SubnetIcon,
  ServiceDiscoveryIcon,
  ServiceMeshIcon,
  NetworkFirewallIcon,
};

export const networkingAndTrafficIconRegistry: Record<string, InfrastructureIconComponent> = {
  "load-balancer": LoadBalancerIcon,
  "layer-4-load-balancer": Layer4LoadBalancerIcon,
  "layer-7-load-balancer": Layer7LoadBalancerIcon,
  "api-gateway": ApiGatewayIcon,
  "ingress-controller": IngressControllerIcon,
  "forward-proxy": ForwardProxyIcon,
  "nat-gateway": NatGatewayIcon,
  vpc: VpcIcon,
  subnet: SubnetIcon,
  "service-discovery": ServiceDiscoveryIcon,
  "service-mesh": ServiceMeshIcon,
  "network-firewall": NetworkFirewallIcon,
};

export function getNetworkingAndTrafficInfrastructureIcon(
  slug: string
): InfrastructureIconComponent | null {
  return networkingAndTrafficIconRegistry[slug] || null;
}
