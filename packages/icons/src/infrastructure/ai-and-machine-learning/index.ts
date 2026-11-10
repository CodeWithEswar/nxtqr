import type { InfrastructureIconComponent } from "../types";

import { ModelServingIcon } from "./model-serving-icon";
import { FeatureStoreIcon } from "./feature-store-icon";
import { VectorEmbeddingPipelineIcon } from "./vector-embedding-pipeline-icon";
import { GpuClusterIcon } from "./gpu-cluster-icon";
import { InferenceCacheIcon } from "./inference-cache-icon";
import { FineTuningJobIcon } from "./fine-tuning-job-icon";
import { ModelRegistryIcon } from "./model-registry-icon";
import { EvaluationGatewayIcon } from "./evaluation-gateway-icon";
import { GuardrailProxyIcon } from "./guardrail-proxy-icon";
import { AgentOrchestratorIcon } from "./agent-orchestrator-icon";

export {
  ModelServingIcon,
  FeatureStoreIcon,
  VectorEmbeddingPipelineIcon,
  GpuClusterIcon,
  InferenceCacheIcon,
  FineTuningJobIcon,
  ModelRegistryIcon,
  EvaluationGatewayIcon,
  GuardrailProxyIcon,
  AgentOrchestratorIcon,
};

export const aiAndMachineLearningIconRegistry: Record<string, InfrastructureIconComponent> = {
  "model-serving": ModelServingIcon,
  "feature-store": FeatureStoreIcon,
  "vector-embedding-pipeline": VectorEmbeddingPipelineIcon,
  "gpu-cluster": GpuClusterIcon,
  "inference-cache": InferenceCacheIcon,
  "fine-tuning-job": FineTuningJobIcon,
  "model-registry": ModelRegistryIcon,
  "evaluation-gateway": EvaluationGatewayIcon,
  "guardrail-proxy": GuardrailProxyIcon,
  "agent-orchestrator": AgentOrchestratorIcon,
};

