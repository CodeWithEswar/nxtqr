export {
  ProjectSchema,
  ProjectStatusSchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  ProjectFilterSchema,
  VisualizerTypeSchema,
  type Project,
  type ProjectStatus,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ProjectFilterInput,
} from "@nxtqr/validation";

export const VISUALIZER_TYPE_METADATA: Record<
  string,
  { label: string; description: string; iconName: string }
> = {
  "system-design": {
    label: "System Design Visualizer",
    description: "Distributed architectures, microservices, caches, and load balancers.",
    iconName: "CpuIcon",
  },
  database: {
    label: "Database Cluster Visualizer",
    description: "Replication topologies, sharding, indexes, and failover mechanics.",
    iconName: "DatabaseIcon",
  },
  networking: {
    label: "Network Mesh Visualizer",
    description: "Gateways, service meshes, protocols, and ingress packet flows.",
    iconName: "ActivityIcon",
  },
  "ai-agents": {
    label: "AI Agent Orchestration",
    description: "Multi-agent chains, tool execution, and context routing graphs.",
    iconName: "LayersIcon",
  },
  rag: {
    label: "RAG Pipeline Visualizer",
    description: "Vector embeddings, retrieval pipelines, and chunk rerankers.",
    iconName: "SearchIcon",
  },
  algorithms: {
    label: "Algorithms & State Machine",
    description: "Graph traversals, consensus protocols, and execution trees.",
    iconName: "TerminalIcon",
  },
  cloud: {
    label: "Cloud Infrastructure",
    description: "Virtual networks, serverless functions, and storage buckets.",
    iconName: "GridIcon",
  },
  cicd: {
    label: "CI/CD Deployment Pipelines",
    description: "Automated build matrices, canary gates, and artifact deployment.",
    iconName: "CheckCircleIcon",
  },
  "operating-systems": {
    label: "Operating System Kernel",
    description: "Process schedulers, memory paging, and virtual file systems.",
    iconName: "SlidersIcon",
  },
};

