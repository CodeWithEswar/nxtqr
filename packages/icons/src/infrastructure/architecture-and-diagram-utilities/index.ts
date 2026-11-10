export * from "./system-boundary-icon";
export * from "./service-group-icon";
export * from "./network-boundary-icon";
export * from "./trust-boundary-icon";
export * from "./architecture-note-icon";
export * from "./decision-annotation-icon";
export * from "./traffic-label-icon";
export * from "./connection-junction-icon";
export * from "./external-dependency-icon";
export * from "./failure-zone-icon";

import { SystemBoundaryIcon } from "./system-boundary-icon";
import { ServiceGroupIcon } from "./service-group-icon";
import { NetworkBoundaryIcon } from "./network-boundary-icon";
import { TrustBoundaryIcon } from "./trust-boundary-icon";
import { ArchitectureNoteIcon } from "./architecture-note-icon";
import { DecisionAnnotationIcon } from "./decision-annotation-icon";
import { TrafficLabelIcon } from "./traffic-label-icon";
import { ConnectionJunctionIcon } from "./connection-junction-icon";
import { ExternalDependencyIcon } from "./external-dependency-icon";
import { FailureZoneIcon } from "./failure-zone-icon";
import type { InfrastructureIconComponent } from "../types";

export const architectureAndDiagramUtilitiesIconRegistry: Record<string, InfrastructureIconComponent> = {
  "system-boundary": SystemBoundaryIcon,
  "service-group": ServiceGroupIcon,
  "network-boundary": NetworkBoundaryIcon,
  "trust-boundary": TrustBoundaryIcon,
  "architecture-note": ArchitectureNoteIcon,
  "decision-annotation": DecisionAnnotationIcon,
  "traffic-label": TrafficLabelIcon,
  "connection-junction": ConnectionJunctionIcon,
  "external-dependency": ExternalDependencyIcon,
  "failure-zone": FailureZoneIcon,
};

export function getArchitectureAndDiagramUtilitiesIcon(slug: string): InfrastructureIconComponent | undefined {
  return architectureAndDiagramUtilitiesIconRegistry[slug];
}
