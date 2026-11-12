import type { ComponentBehaviorAdapter } from "./behavior-adapter";
import { ClientBehaviorAdapter } from "./client-behavior";
import { GatewayBehaviorAdapter } from "./gateway-behavior";
import { LoadBalancerBehaviorAdapter } from "./load-balancer-behavior";
import { ServiceBehaviorAdapter } from "./service-behavior";

export class ComponentBehaviorRegistry {
  private adapters: Map<string, ComponentBehaviorAdapter> = new Map();
  private defaultAdapter: ComponentBehaviorAdapter;

  constructor() {
    this.defaultAdapter = new ServiceBehaviorAdapter();

    this.register(new ClientBehaviorAdapter());
    this.register(new GatewayBehaviorAdapter());
    this.register(new LoadBalancerBehaviorAdapter());
    this.register(this.defaultAdapter);
  }

  public register(adapter: ComponentBehaviorAdapter): void {
    for (const type of adapter.supportedTypes) {
      this.adapters.set(type.toLowerCase(), adapter);
    }
  }

  public resolve(componentType: string): ComponentBehaviorAdapter {
    const normalized = (componentType || "service").toLowerCase();
    return this.adapters.get(normalized) || this.defaultAdapter;
  }
}

export const componentBehaviorRegistry = new ComponentBehaviorRegistry();
