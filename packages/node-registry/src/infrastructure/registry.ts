import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  InfrastructureCategoryDefinition,
  InfrastructureComponentDefinition,
  CreateInfrastructureNodeOptions,
} from "./types";
import {
  clientsCategoryDefinition,
  ALL_CLIENT_DEFINITIONS,
} from "./definitions/clients";
import {
  dnsCdnEdgeCategoryDefinition,
  ALL_DNS_CDN_EDGE_DEFINITIONS,
} from "./definitions/dns-cdn-edge";
import {
  networkingAndTrafficCategoryDefinition,
  ALL_NETWORKING_AND_TRAFFIC_DEFINITIONS,
} from "./definitions/networking-and-traffic";
import {
  computeAndApplicationServicesCategoryDefinition,
  ALL_COMPUTE_AND_APPLICATION_SERVICES_DEFINITIONS,
} from "./definitions/compute-and-application-services";
import {
  databasesAndPersistenceCategoryDefinition,
  ALL_DATABASES_AND_PERSISTENCE_DEFINITIONS,
} from "./definitions/databases-and-persistence";
import {
  cachingAndPerformanceCategoryDefinition,
  ALL_CACHING_AND_PERFORMANCE_DEFINITIONS,
} from "./definitions/caching-and-performance";
import {
  messagingAndEventSystemsCategoryDefinition,
  ALL_MESSAGING_AND_EVENT_SYSTEMS_DEFINITIONS,
} from "./definitions/messaging-and-event-systems";

export class InfrastructureRegistryClass {
  private categories = new Map<string, InfrastructureCategoryDefinition>();
  private components = new Map<string, InfrastructureComponentDefinition>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    // 1. Register Clients & User Interfaces Category (Cat 01)
    this.registerCategory(clientsCategoryDefinition);
    for (const def of ALL_CLIENT_DEFINITIONS) {
      this.registerComponent(def);
    }

    // 2. Register DNS, CDN & Edge Infrastructure Category (Cat 02)
    this.registerCategory(dnsCdnEdgeCategoryDefinition);
    for (const def of ALL_DNS_CDN_EDGE_DEFINITIONS) {
      this.registerComponent(def);
    }

    // 3. Register Networking & Traffic Infrastructure Category (Cat 03)
    this.registerCategory(networkingAndTrafficCategoryDefinition);
    for (const def of ALL_NETWORKING_AND_TRAFFIC_DEFINITIONS) {
      this.registerComponent(def);
    }

    // 4. Register Compute & Application Services Category (Cat 04)
    this.registerCategory(computeAndApplicationServicesCategoryDefinition);
    for (const def of ALL_COMPUTE_AND_APPLICATION_SERVICES_DEFINITIONS) {
      this.registerComponent(def);
    }

    // 5. Register Databases & Persistence Category (Cat 05)
    this.registerCategory(databasesAndPersistenceCategoryDefinition);
    for (const def of ALL_DATABASES_AND_PERSISTENCE_DEFINITIONS) {
      this.registerComponent(def);
    }

    // 6. Register Caching & Performance Category (Cat 06)
    this.registerCategory(cachingAndPerformanceCategoryDefinition);
    for (const def of ALL_CACHING_AND_PERFORMANCE_DEFINITIONS) {
      this.registerComponent(def);
    }

    // 7. Register Messaging & Event Systems Category (Cat 07)
    this.registerCategory(messagingAndEventSystemsCategoryDefinition);
    for (const def of ALL_MESSAGING_AND_EVENT_SYSTEMS_DEFINITIONS) {
      this.registerComponent(def);
    }
  }

  public registerCategory(category: InfrastructureCategoryDefinition): void {
    this.categories.set(category.id, category);
  }

  public registerComponent(def: InfrastructureComponentDefinition): void {
    if (this.components.has(def.id)) {
      throw new Error(
        `[NXTQR Infrastructure Registry] Component "${def.id}" is already registered.`
      );
    }
    this.components.set(def.id, def);
  }

  public getCategory(categoryId: string): InfrastructureCategoryDefinition | undefined {
    return this.categories.get(categoryId);
  }

  public listCategories(): InfrastructureCategoryDefinition[] {
    return Array.from(this.categories.values()).sort((a, b) => a.order - b.order);
  }

  public getComponent(id: string): InfrastructureComponentDefinition | undefined {
    return this.components.get(id);
  }

  public listComponents(): InfrastructureComponentDefinition[] {
    return Array.from(this.components.values());
  }

  public listComponentsByCategory(categoryId: string): InfrastructureComponentDefinition[] {
    return Array.from(this.components.values()).filter(
      (comp) => comp.categoryId === categoryId
    );
  }

  public searchComponents(query: string): InfrastructureComponentDefinition[] {
    if (!query || !query.trim()) {
      return this.listComponents();
    }

    const q = query.toLowerCase().trim();
    return Array.from(this.components.values()).filter((comp) => {
      if (comp.id.toLowerCase().includes(q)) return true;
      if (comp.display.name.toLowerCase().includes(q)) return true;
      if (comp.display.shortName.toLowerCase().includes(q)) return true;
      if (comp.display.description.toLowerCase().includes(q)) return true;
      if (comp.display.keywords.some((k) => k.toLowerCase().includes(q))) return true;
      return false;
    });
  }

  public validateConfiguration(
    id: string,
    config: unknown
  ): { success: boolean; data?: Record<string, unknown>; errors?: string[] } {
    const comp = this.getComponent(id);
    if (!comp) {
      return { success: false, errors: [`Unknown infrastructure component "${id}"`] };
    }

    const payload =
      typeof config === "object" && config !== null
        ? { ...comp.defaultConfig, ...(config as Record<string, unknown>) }
        : config;

    const result = comp.configSchema.safeParse(payload);
    if (result.success) {
      return { success: true, data: result.data as Record<string, unknown> };
    }

    const errors = result.error.errors.map(
      (e) => `${e.path.join(".") || "config"}: ${e.message}`
    );
    return { success: false, errors };
  }

  public createInfrastructureNode(
    id: string,
    options: CreateInfrastructureNodeOptions = {}
  ): BaseNode {
    const comp = this.getComponent(id);
    if (!comp) {
      throw new Error(`[NXTQR Infrastructure Registry] Cannot create node: Component "${id}" not found.`);
    }

    const nodeId = options.id || `infra_${comp.id}_${crypto.randomUUID().slice(0, 8)}`;
    const position = options.position || { x: 300, y: 200 };

    // Merge default config with user overrides
    const configData: Record<string, unknown> = {
      ...comp.defaultConfig,
      ...(options.config || {}),
      label: options.label || options.config?.label || comp.display.name,
      environment: options.environment || options.config?.environment || "production",
    };

    return {
      id: nodeId,
      type: comp.id,
      position,
      dimensions: {
        width: comp.node.minWidth,
        height: comp.node.minHeight,
      },
      status: "idle",
      label: String(configData.label || comp.display.name),
      description: comp.display.description,
      data: {
        ...configData,
        isInfrastructure: true,
        categoryId: comp.categoryId,
        componentType: comp.id,
        version: comp.version,
        iconSlug: comp.display.iconSlug,
      },
      ports: [...comp.ports],
      metadata: {
        infrastructureCategory: comp.categoryId,
        version: comp.version,
      },
    };
  }

  public clear(): void {
    this.categories.clear();
    this.components.clear();
  }

  public resetToDefaults(): void {
    this.clear();
    this.registerDefaults();
  }
}

export const infrastructureRegistry = new InfrastructureRegistryClass();
