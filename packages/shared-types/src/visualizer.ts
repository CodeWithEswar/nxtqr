export type VisualizerType =
  | "generic"
  | "system-design"
  | "rag"
  | "ai-agents"
  | "database"
  | "algorithms"
  | "networking"
  | "cloud"
  | "cicd"
  | "operating-systems";

export interface VisualizerDefinition {
  id: VisualizerType;
  version: string;
  displayName: string;
  description: string;
  supportedNodeTypes: string[];
  supportedEdgeTypes: string[];
  iconName: string;
}
