export * from "./git-repository-icon";
export * from "./ci-pipeline-icon";
export * from "./cd-pipeline-icon";
export * from "./build-server-icon";
export * from "./artifact-registry-icon";
export * from "./container-registry-icon";
export * from "./deployment-controller-icon";
export * from "./infrastructure-as-code-icon";
export * from "./feature-flag-service-icon";
export * from "./configuration-service-icon";
export * from "./secrets-injection-service-icon";
export * from "./release-manager-icon";

import type { InfrastructureIconComponent } from "../types";
import { GitRepositoryIcon } from "./git-repository-icon";
import { CiPipelineIcon } from "./ci-pipeline-icon";
import { CdPipelineIcon } from "./cd-pipeline-icon";
import { BuildServerIcon } from "./build-server-icon";
import { ArtifactRegistryIcon } from "./artifact-registry-icon";
import { ContainerRegistryIcon } from "./container-registry-icon";
import { DeploymentControllerIcon } from "./deployment-controller-icon";
import { InfrastructureAsCodeIcon } from "./infrastructure-as-code-icon";
import { FeatureFlagServiceIcon } from "./feature-flag-service-icon";
import { ConfigurationServiceIcon } from "./configuration-service-icon";
import { SecretsInjectionServiceIcon } from "./secrets-injection-service-icon";
import { ReleaseManagerIcon } from "./release-manager-icon";

export const devopsAndDeploymentIconRegistry: Record<string, InfrastructureIconComponent> = {
  "git-repository": GitRepositoryIcon,
  "ci-pipeline": CiPipelineIcon,
  "cd-pipeline": CdPipelineIcon,
  "build-server": BuildServerIcon,
  "artifact-registry": ArtifactRegistryIcon,
  "container-registry": ContainerRegistryIcon,
  "deployment-controller": DeploymentControllerIcon,
  "infrastructure-as-code": InfrastructureAsCodeIcon,
  "feature-flag-service": FeatureFlagServiceIcon,
  "configuration-service": ConfigurationServiceIcon,
  "secrets-injection-service": SecretsInjectionServiceIcon,
  "release-manager": ReleaseManagerIcon,
};

export function getDevopsAndDeploymentInfrastructureIcon(
  slug: string
): InfrastructureIconComponent | undefined {
  return devopsAndDeploymentIconRegistry[slug];
}

