import { z } from "zod";
import { BaseNodeSchema, BaseEdgeSchema, GraphDocumentSchema } from "@nxtqr/graph-schema";

export const TutorialScenarioSchema = z.enum(["isolated", "connected", "architecture"]);
export type TutorialScenario = z.infer<typeof TutorialScenarioSchema>;

export const TutorialPortInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["input", "output", "bidirectional"]),
  dataType: z.string().optional(),
  description: z.string().optional(),
  compatibleTypes: z.array(z.string()).default([]),
});
export type TutorialPortInfo = z.infer<typeof TutorialPortInfoSchema>;

export const TutorialMechanicStepSchema = z.object({
  step: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  latency: z.string().optional(),
  failureRisk: z.string().optional(),
});
export type TutorialMechanicStep = z.infer<typeof TutorialMechanicStepSchema>;

export const TutorialTradeoffSchema = z.object({
  dimension: z.string(),
  choiceA: z.string(),
  choiceB: z.string(),
  analysis: z.string(),
  recommendedContext: z.string(),
});
export type TutorialTradeoff = z.infer<typeof TutorialTradeoffSchema>;

export const TutorialFailureModeSchema = z.object({
  name: z.string(),
  trigger: z.string(),
  impact: z.string(),
  mitigation: z.string(),
});
export type TutorialFailureMode = z.infer<typeof TutorialFailureModeSchema>;

export const ComponentTutorialSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  iconSlug: z.string(),
  classification: z.string(),
  tagline: z.string(),
  overview: z.string(),
  problemSolved: z.string(),
  howItWorks: z.object({
    summary: z.string(),
    steps: z.array(TutorialMechanicStepSchema),
  }),
  whenToUse: z.array(z.string()),
  whenToAvoid: z.array(z.string()),
  tradeoffs: z.array(TutorialTradeoffSchema),
  failureModes: z.array(TutorialFailureModeSchema),
  ports: z.array(TutorialPortInfoSchema),
  compatibleUpstream: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      reason: z.string(),
    })
  ),
  compatibleDownstream: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      reason: z.string(),
    })
  ),
  relatedComponentIds: z.array(z.string()),
  exampleArchitectureIds: z.array(z.string()),
  previewNodes: z.object({
    isolated: z.array(BaseNodeSchema),
    connected: z.array(BaseNodeSchema),
    architecture: z.array(BaseNodeSchema),
  }),
  previewEdges: z.object({
    isolated: z.array(BaseEdgeSchema),
    connected: z.array(BaseEdgeSchema),
    architecture: z.array(BaseEdgeSchema),
  }),
});
export type ComponentTutorial = z.infer<typeof ComponentTutorialSchema>;

export const ArchitectureFlowStepSchema = z.object({
  step: z.number().int().positive(),
  from: z.string(),
  to: z.string(),
  protocol: z.string(),
  edgeIds: z.array(z.string()).min(1),
  description: z.string(),
});
export type ArchitectureFlowStep = z.infer<typeof ArchitectureFlowStepSchema>;

export const ArchitectureDecisionSchema = z.object({
  topic: z.string(),
  decision: z.string(),
  why: z.string(),
  alternativeRejected: z.string(),
});
export type ArchitectureDecision = z.infer<typeof ArchitectureDecisionSchema>;

export const ArchitectureExampleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string(),
  category: z.string(),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  scale: z.object({
    requestsPerSec: z.string().optional(),
    storagePerDay: z.string().optional(),
    latencyTarget: z.string().optional(),
    availabilityTarget: z.string().optional(),
  }),
  summary: z.string(),
  requirements: z.object({
    functional: z.array(z.string()),
    nonFunctional: z.array(z.string()),
  }),
  flowSteps: z.array(ArchitectureFlowStepSchema),
  keyDecisions: z.array(ArchitectureDecisionSchema),
  tradeoffs: z.array(z.string()),
  graphDocument: GraphDocumentSchema,
  featuredComponentIds: z.array(z.string()),
});
export type ArchitectureExample = z.infer<typeof ArchitectureExampleSchema>;

export const ConceptSectionSchema = z.object({
  title: z.string(),
  content: z.string(),
  codeOrFormula: z.string().optional(),
});
export type ConceptSection = z.infer<typeof ConceptSectionSchema>;

export const ConceptGuideSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string(),
  readTime: z.string(),
  summary: z.string(),
  sections: z.array(ConceptSectionSchema),
  relatedComponentIds: z.array(z.string()),
  relatedExampleIds: z.array(z.string()),
});
export type ConceptGuide = z.infer<typeof ConceptGuideSchema>;
