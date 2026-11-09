import type { VisualizerType } from "@nxtqr/shared-types";
import type { PortDefinition } from "@nxtqr/graph-schema";
import { standardNodeDefinitions } from "./definitions";

export interface NodeDefinition {
  type: string;
  visualizerType: VisualizerType;
  label: string;
  category: string;
  description: string;
  defaultData: Record<string, unknown>;
  ports: PortDefinition[];
  iconName?: string;
}

class NodeRegistryClass {
  private registry = new Map<string, NodeDefinition>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    for (const def of standardNodeDefinitions) {
      this.registry.set(`${def.visualizerType}:${def.type}`, def);
    }
  }

  public register(def: NodeDefinition): void {
    const key = `${def.visualizerType}:${def.type}`;
    if (this.registry.has(key)) {
      throw new Error(`[NXTQR Node Registry] Node type "${key}" is already registered.`);
    }
    this.registry.set(key, def);
  }

  public get(visualizerType: VisualizerType, type: string): NodeDefinition | undefined {
    const specific = this.registry.get(`${visualizerType}:${type}`);
    if (specific) return specific;
    if (visualizerType !== "generic") {
      return this.registry.get(`generic:${type}`);
    }
    return undefined;
  }

  public listForVisualizer(visualizerType: VisualizerType): NodeDefinition[] {
    const list = Array.from(this.registry.values()).filter(
      (def) => def.visualizerType === visualizerType,
    );
    if (visualizerType !== "generic" && list.length === 0) {
      return this.listFoundations();
    }
    return list;
  }

  public listFoundations(): NodeDefinition[] {
    return Array.from(this.registry.values()).filter(
      (def) => def.visualizerType === "generic",
    );
  }

  public clear(): void {
    this.registry.clear();
  }

  public resetToDefaults(): void {
    this.clear();
    this.registerDefaults();
  }
}

export const nodeRegistry = new NodeRegistryClass();
