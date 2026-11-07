import type { VisualizerType } from "@nxtqr/shared-types";
import type { PortDefinition } from "@nxtqr/graph-schema";

export interface NodeDefinition {
  type: string;
  visualizerType: VisualizerType;
  label: string;
  category: string;
  description: string;
  defaultData: Record<string, unknown>;
  ports: PortDefinition[];
}

class NodeRegistryClass {
  private registry = new Map<string, NodeDefinition>();

  public register(def: NodeDefinition): void {
    const key = `${def.visualizerType}:${def.type}`;
    if (this.registry.has(key)) {
      throw new Error(`[NXTQR Node Registry] Node type "${key}" is already registered.`);
    }
    this.registry.set(key, def);
  }

  public get(visualizerType: VisualizerType, type: string): NodeDefinition | undefined {
    return this.registry.get(`${visualizerType}:${type}`);
  }

  public listForVisualizer(visualizerType: VisualizerType): NodeDefinition[] {
    return Array.from(this.registry.values()).filter(
      (def) => def.visualizerType === visualizerType,
    );
  }

  public clear(): void {
    this.registry.clear();
  }
}

export const nodeRegistry = new NodeRegistryClass();
