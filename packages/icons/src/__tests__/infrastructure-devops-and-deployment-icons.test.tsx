import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  GitRepositoryIcon,
  CiPipelineIcon,
  CdPipelineIcon,
  BuildServerIcon,
  ArtifactRegistryIcon,
  ContainerRegistryIcon,
  DeploymentControllerIcon,
  InfrastructureAsCodeIcon,
  FeatureFlagServiceIcon,
  ConfigurationServiceIcon,
  SecretsInjectionServiceIcon,
  ReleaseManagerIcon,
  devopsAndDeploymentIconRegistry,
  getDevopsAndDeploymentInfrastructureIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_15_ICONS = [
  { slug: "git-repository", name: "GitRepositoryIcon", Component: GitRepositoryIcon },
  { slug: "ci-pipeline", name: "CiPipelineIcon", Component: CiPipelineIcon },
  { slug: "cd-pipeline", name: "CdPipelineIcon", Component: CdPipelineIcon },
  { slug: "build-server", name: "BuildServerIcon", Component: BuildServerIcon },
  { slug: "artifact-registry", name: "ArtifactRegistryIcon", Component: ArtifactRegistryIcon },
  { slug: "container-registry", name: "ContainerRegistryIcon", Component: ContainerRegistryIcon },
  { slug: "deployment-controller", name: "DeploymentControllerIcon", Component: DeploymentControllerIcon },
  { slug: "infrastructure-as-code", name: "InfrastructureAsCodeIcon", Component: InfrastructureAsCodeIcon },
  { slug: "feature-flag-service", name: "FeatureFlagServiceIcon", Component: FeatureFlagServiceIcon },
  { slug: "configuration-service", name: "ConfigurationServiceIcon", Component: ConfigurationServiceIcon },
  { slug: "secrets-injection-service", name: "SecretsInjectionServiceIcon", Component: SecretsInjectionServiceIcon },
  { slug: "release-manager", name: "ReleaseManagerIcon", Component: ReleaseManagerIcon },
] as const;

describe("Category 15 — DevOps & Deployment Infrastructure Icons", () => {
  it("renders all 12 icons in colored mode with 32x32 viewBox", () => {
    expect(ALL_CATEGORY_15_ICONS).toHaveLength(12);

    for (const { slug, name, Component } of ALL_CATEGORY_15_ICONS) {
      const html = renderToString(<Component size={32} variant="colored" />);
      expect(html, `Icon "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('viewBox="0 0 32 32"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
    }
  });

  it("renders all 12 icons in monochrome mode with accessible titles", () => {
    for (const { name, Component } of ALL_CATEGORY_15_ICONS) {
      const html = renderToString(
        <Component size={24} variant="monochrome" decorative={false} title={name} />
      );
      expect(html).toContain("<svg");
      expect(html).toContain("<title>");
      expect(html).toContain(name);
      expect(html).toContain('role="img"');
    }
  });

  it("registers all 12 icons in devopsAndDeploymentIconRegistry and allInfrastructureIconRegistry", () => {
    expect(Object.keys(devopsAndDeploymentIconRegistry)).toHaveLength(12);

    for (const { slug, Component } of ALL_CATEGORY_15_ICONS) {
      expect(devopsAndDeploymentIconRegistry[slug]).toBe(Component);
      expect(getDevopsAndDeploymentInfrastructureIcon(slug)).toBe(Component);
      expect(getInfrastructureIcon(slug)).toBe(Component);
    }
  });
});

