import type { BaseExecutionEvent } from "../domain/execution-event";
import type { TemplatePublicationStatus } from "./template-schemas";

export interface BaseTemplateEvent extends BaseExecutionEvent {
  templateId: string;
  templateVersion: string;
  actor: "user" | "validator" | "simulator" | "walkthrough" | "system";
}

export type TemplateExecutionEvent =
  | (BaseTemplateEvent & {
      type: "template.resolved";
      slug: string;
      contentHash: string;
    })
  | (BaseTemplateEvent & {
      type: "template.validated";
      valid: boolean;
      publicationStatus: TemplatePublicationStatus;
      errorCount: number;
      warningCount: number;
    })
  | (BaseTemplateEvent & {
      type: "template.instantiated";
      instantiationId: string;
      targetProjectId: string;
      targetRevisionId: string;
    })
  | (BaseTemplateEvent & {
      type: "template.scenario.started";
      scenarioId: string;
      workloadRps: number;
      seed: number;
    })
  | (BaseTemplateEvent & {
      type: "template.scenario.fault_injected";
      scenarioId: string;
      faultType: string;
      targetId?: string;
    })
  | (BaseTemplateEvent & {
      type: "template.scenario.completed";
      scenarioId: string;
      p95LatencyMs: number;
      availability: number;
      matchedObservations: number;
      totalObservations: number;
    })
  | (BaseTemplateEvent & {
      type: "template.walkthrough.step";
      walkthroughId: string;
      stepId: string;
      stepOrder: number;
      focusNodeId?: string;
      highlightEdgeId?: string;
    })
  | (BaseTemplateEvent & {
      type: "template.variant.compared";
      baselineLabel: string;
      candidateLabel: string;
      complexityDelta: number;
    })
  | (BaseTemplateEvent & {
      type: "template.exported";
      integrityHash: string;
      exportSchemaVersion: number;
    });
