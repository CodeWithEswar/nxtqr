import type { ArchitectureDecisionRecord, ADRStatus } from "../contracts/adr.types";
import { ArchitectureDecisionRecordSchema } from "../schemas/adr.schemas";

export class ADRManager {
  private adrs: Map<string, ArchitectureDecisionRecord> = new Map();

  constructor(initialAdrs: ArchitectureDecisionRecord[] = []) {
    for (const adr of initialAdrs) {
      this.registerADR(adr);
    }
  }

  public registerADR(adr: ArchitectureDecisionRecord): ArchitectureDecisionRecord {
    const validated = ArchitectureDecisionRecordSchema.parse(adr);
    this.adrs.set(validated.id, validated);
    return validated;
  }

  public createADR(params: Omit<ArchitectureDecisionRecord, "id" | "decisionNumber" | "date"> & {
    id?: string;
    decisionNumber?: number;
    date?: string;
  }): ArchitectureDecisionRecord {
    const nextNumber =
      params.decisionNumber ??
      (this.adrs.size > 0
        ? Math.max(...Array.from(this.adrs.values()).map((a) => a.decisionNumber)) + 1
        : 1);

    const record: ArchitectureDecisionRecord = {
      id: params.id ?? `adr-${String(nextNumber).padStart(4, "0")}`,
      decisionNumber: nextNumber,
      title: params.title,
      status: params.status,
      context: params.context,
      decision: params.decision,
      consequences: params.consequences,
      alternativesConsidered: params.alternativesConsidered,
      relatedComponentIds: params.relatedComponentIds ?? [],
      relatedFindingIds: params.relatedFindingIds ?? [],
      date: params.date ?? new Date().toISOString().split("T")[0],
      author: params.author,
      supersededBy: params.supersededBy,
      supersedes: params.supersedes,
      tags: params.tags ?? [],
    };

    return this.registerADR(record);
  }

  public getADR(id: string): ArchitectureDecisionRecord | undefined {
    return this.adrs.get(id);
  }

  public getAllADRs(): ArchitectureDecisionRecord[] {
    return Array.from(this.adrs.values()).sort(
      (a, b) => a.decisionNumber - b.decisionNumber
    );
  }

  public getADRsByStatus(status: ADRStatus): ArchitectureDecisionRecord[] {
    return this.getAllADRs().filter((a) => a.status === status);
  }

  public getADRsForComponent(componentId: string): ArchitectureDecisionRecord[] {
    return this.getAllADRs().filter((a) =>
      a.relatedComponentIds.includes(componentId)
    );
  }

  public getADRsForFinding(findingId: string): ArchitectureDecisionRecord[] {
    return this.getAllADRs().filter((a) =>
      a.relatedFindingIds.includes(findingId)
    );
  }

  public supersedeADR(
    targetId: string,
    newAdrParams: Omit<ArchitectureDecisionRecord, "id" | "decisionNumber" | "date" | "supersedes"> & {
      id?: string;
    }
  ): { superseded: ArchitectureDecisionRecord; successor: ArchitectureDecisionRecord } {
    const existing = this.getADR(targetId);
    if (!existing) {
      throw new Error(`Target ADR ${targetId} not found to supersede.`);
    }

    const successor = this.createADR({
      ...newAdrParams,
      supersedes: existing.id,
    });

    const updatedSuperseded: ArchitectureDecisionRecord = {
      ...existing,
      status: "superseded",
      supersededBy: successor.id,
    };
    this.registerADR(updatedSuperseded);

    return { superseded: updatedSuperseded, successor };
  }

  public deprecateADR(id: string): ArchitectureDecisionRecord {
    const existing = this.getADR(id);
    if (!existing) {
      throw new Error(`ADR ${id} not found.`);
    }
    const updated: ArchitectureDecisionRecord = {
      ...existing,
      status: "deprecated",
    };
    return this.registerADR(updated);
  }

  public toMarkdown(adr: ArchitectureDecisionRecord): string {
    const lines: string[] = [
      `# ADR-${String(adr.decisionNumber).padStart(4, "0")}: ${adr.title}`,
      "",
      `**Status:** ${adr.status.toUpperCase()}`,
      `**Date:** ${adr.date}`,
      `**Author:** ${adr.author}`,
    ];

    if (adr.supersedes) {
      lines.push(`**Supersedes:** ${adr.supersedes}`);
    }
    if (adr.supersededBy) {
      lines.push(`**Superseded By:** ${adr.supersededBy}`);
    }
    if (adr.tags && adr.tags.length > 0) {
      lines.push(`**Tags:** ${adr.tags.join(", ")}`);
    }

    lines.push("", "## Context", adr.context, "", "## Decision", adr.decision, "", "## Consequences");

    if (adr.consequences.positive.length > 0) {
      lines.push("### Positive");
      adr.consequences.positive.forEach((p) => lines.push(`- ${p}`));
    }
    if (adr.consequences.negative.length > 0) {
      lines.push("### Negative");
      adr.consequences.negative.forEach((n) => lines.push(`- ${n}`));
    }
    if (adr.consequences.neutral && adr.consequences.neutral.length > 0) {
      lines.push("### Neutral");
      adr.consequences.neutral.forEach((nu) => lines.push(`- ${nu}`));
    }

    if (adr.alternativesConsidered.length > 0) {
      lines.push("", "## Alternatives Considered");
      for (const alt of adr.alternativesConsidered) {
        lines.push(`### ${alt.title}`);
        lines.push(alt.description);
        lines.push(`*Reason Rejected:* ${alt.reasonRejected}`);
        lines.push("");
      }
    }

    return lines.join("\n");
  }
}
