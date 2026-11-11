export type ADRStatus = "proposed" | "accepted" | "superseded" | "deprecated";

export interface ArchitectureDecisionRecord {
  id: string;
  decisionNumber: number;
  title: string;
  status: ADRStatus;
  context: string;
  decision: string;
  consequences: {
    positive: string[];
    negative: string[];
    neutral?: string[];
  };
  alternativesConsidered: Array<{
    title: string;
    description: string;
    reasonRejected: string;
  }>;
  relatedComponentIds: string[];
  relatedFindingIds: string[];
  date: string;
  author: string;
  supersededBy?: string; // ID of ADR that supersedes this one
  supersedes?: string;   // ID of ADR this one supersedes
  tags?: string[];
}
