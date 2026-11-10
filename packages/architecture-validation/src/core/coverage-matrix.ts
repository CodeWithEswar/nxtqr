import { infrastructureRegistry } from "@nxtqr/node-registry";
import { portResolver } from "./port-resolver";
import { capabilityResolver } from "./capability-resolver";
import { getComponentDocumentationPath } from "../messages/validation-messages";

export interface ComponentCoverageEntry {
  componentId: string;
  name: string;
  categoryId: string;
  registryDefinitionExists: boolean;
  capabilitiesDefined: boolean;
  capabilitiesCount: number;
  portsDefined: boolean;
  portsCount: number;
  documentationPath: string;
  status: "implemented" | "partially-implemented" | "not-applicable";
}

export interface CategoryCoverageSummary {
  categoryId: string;
  categoryName: string;
  totalComponents: number;
  implementedComponents: number;
  percentage: number;
}

export interface RuleCoverageMatrixReport {
  totalComponents: number;
  implementedCount: number;
  coveragePercentage: number;
  categories: CategoryCoverageSummary[];
  entries: ComponentCoverageEntry[];
}

export function generateRuleCoverageMatrix(): RuleCoverageMatrixReport {
  const components = infrastructureRegistry.listComponents();
  const categories = infrastructureRegistry.listCategories();

  const entries: ComponentCoverageEntry[] = components.map((comp) => {
    const dummyNode = {
      id: `test_${comp.id}`,
      type: comp.id,
      position: { x: 0, y: 0 },
      data: {
        componentType: comp.id,
        categoryId: comp.categoryId,
        ...comp.defaultConfig,
      },
    };

    const caps = capabilityResolver.resolveNodeCapabilities(dummyNode);
    const ports = portResolver.resolveNodePorts(dummyNode);
    const isBoundaryOrNote =
      comp.categoryId === "architecture-and-diagram-utilities" ||
      comp.id.includes("boundary") ||
      comp.id.includes("note");

    const portsDefined = isBoundaryOrNote ? true : ports.length > 0;
    const capabilitiesDefined = caps.length > 0;

    let status: "implemented" | "partially-implemented" | "not-applicable" = "implemented";
    if (isBoundaryOrNote) {
      status = "not-applicable";
    } else if (!capabilitiesDefined || !portsDefined) {
      status = "partially-implemented";
    }

    return {
      componentId: comp.id,
      name: comp.display.name,
      categoryId: comp.categoryId,
      registryDefinitionExists: true,
      capabilitiesDefined,
      capabilitiesCount: caps.length,
      portsDefined,
      portsCount: ports.length,
      documentationPath: getComponentDocumentationPath(comp.id),
      status,
    };
  });

  const categorySummaries: CategoryCoverageSummary[] = categories.map((cat) => {
    const catEntries = entries.filter((e) => e.categoryId === cat.id);
    const implemented = catEntries.filter((e) => e.status === "implemented" || e.status === "not-applicable").length;
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      totalComponents: catEntries.length,
      implementedComponents: implemented,
      percentage: catEntries.length > 0 ? Math.round((implemented / catEntries.length) * 100) : 100,
    };
  });

  const implementedTotal = entries.filter((e) => e.status === "implemented" || e.status === "not-applicable").length;

  return {
    totalComponents: components.length,
    implementedCount: implementedTotal,
    coveragePercentage: components.length > 0 ? Math.round((implementedTotal / components.length) * 100) : 100,
    categories: categorySummaries,
    entries,
  };
}
