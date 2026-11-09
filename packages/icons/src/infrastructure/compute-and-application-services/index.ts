import type { InfrastructureIconComponent } from "../types";
import { WebServerIcon } from "./web-server-icon";
import { ApplicationServerIcon } from "./application-server-icon";
import { BackendServiceIcon } from "./backend-service-icon";
import { MicroserviceIcon } from "./microservice-icon";
import { MonolithicApplicationIcon } from "./monolithic-application-icon";
import { ServerlessFunctionIcon } from "./serverless-function-icon";
import { ContainerIcon } from "./container-icon";
import { ContainerClusterIcon } from "./container-cluster-icon";
import { KubernetesPodIcon } from "./kubernetes-pod-icon";
import { KubernetesServiceIcon } from "./kubernetes-service-icon";
import { VirtualMachineIcon } from "./virtual-machine-icon";
import { BackgroundWorkerIcon } from "./background-worker-icon";
import { ScheduledJobIcon } from "./scheduled-job-icon";
import { BatchProcessorIcon } from "./batch-processor-icon";

export {
  WebServerIcon,
  ApplicationServerIcon,
  BackendServiceIcon,
  MicroserviceIcon,
  MonolithicApplicationIcon,
  ServerlessFunctionIcon,
  ContainerIcon,
  ContainerClusterIcon,
  KubernetesPodIcon,
  KubernetesServiceIcon,
  VirtualMachineIcon,
  BackgroundWorkerIcon,
  ScheduledJobIcon,
  BatchProcessorIcon,
};

export const computeAndApplicationServicesIconRegistry: Record<string, InfrastructureIconComponent> = {
  "web-server": WebServerIcon,
  "application-server": ApplicationServerIcon,
  "backend-service": BackendServiceIcon,
  microservice: MicroserviceIcon,
  "monolithic-application": MonolithicApplicationIcon,
  "serverless-function": ServerlessFunctionIcon,
  container: ContainerIcon,
  "container-cluster": ContainerClusterIcon,
  "kubernetes-pod": KubernetesPodIcon,
  "kubernetes-service": KubernetesServiceIcon,
  "virtual-machine": VirtualMachineIcon,
  "background-worker": BackgroundWorkerIcon,
  "scheduled-job": ScheduledJobIcon,
  "batch-processor": BatchProcessorIcon,
};

export function getComputeAndApplicationServicesInfrastructureIcon(
  slug: string
): InfrastructureIconComponent | null {
  return computeAndApplicationServicesIconRegistry[slug] || null;
}

