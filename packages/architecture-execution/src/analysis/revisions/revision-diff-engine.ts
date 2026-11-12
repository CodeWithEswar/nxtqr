import type {
  AnalysisRevision,
  AnalysisRevisionDiff,
} from "../analysis-schemas";

/**
 * Computes a deterministic 32-bit FNV-1a hex content hash from canonicalized revision data.
 */
export function computeRevisionContentHash(revision: AnalysisRevision): string {
  const canonical = JSON.stringify({
    routingPolicy: revision.routingPolicy,
    scalingMode: revision.scalingMode,
    maxReplicas: revision.maxReplicas,
    components: [...revision.components]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((c) => ({
        ...c,
        dependencyIds: [...c.dependencyIds].sort(),
      })),
    edges: [...revision.edges].sort((a, b) => a.id.localeCompare(b.id)),
  });

  let hash = 2166136261;
  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `rev_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function withComputedRevisionHash(
  revision: AnalysisRevision
): AnalysisRevision {
  return {
    ...revision,
    contentHash: computeRevisionContentHash(revision),
  };
}

/**
 * Deep-clones a baseline revision into an immutable candidate with a new revisionId and fresh hash.
 */
export function cloneRevisionImmutable(
  baseline: AnalysisRevision,
  newRevisionId: string,
  newLabel?: string
): AnalysisRevision {
  const copy: AnalysisRevision = JSON.parse(JSON.stringify(baseline));
  copy.revisionId = newRevisionId;
  copy.parentRevisionId = baseline.revisionId;
  copy.label = newLabel ?? `${baseline.label} (Candidate)`;
  copy.contentHash = computeRevisionContentHash(copy);
  return copy;
}

export function computeSemanticDiff(
  rawBaseline: AnalysisRevision,
  rawCandidate: AnalysisRevision
): AnalysisRevisionDiff {
  const baseline = withComputedRevisionHash(rawBaseline);
  const candidate = withComputedRevisionHash(rawCandidate);

  const baseCompMap = new Map(baseline.components.map((c) => [c.id, c]));
  const candCompMap = new Map(candidate.components.map((c) => [c.id, c]));

  const addedComponents: string[] = [];
  const removedComponents: string[] = [];
  const modifiedComponents: Array<{ componentId: string; changes: string[] }> = [];

  for (const [id, c] of candCompMap) {
    const b = baseCompMap.get(id);
    if (!b) {
      addedComponents.push(id);
      continue;
    }
    const changes: string[] = [];
    if (b.replicas !== c.replicas) {
      changes.push(`replicas: ${b.replicas} -> ${c.replicas}`);
    }
    if (b.capacityPerReplicaRps !== c.capacityPerReplicaRps) {
      changes.push(
        `capacityPerReplica: ${b.capacityPerReplicaRps} -> ${c.capacityPerReplicaRps} rps`
      );
    }
    if (b.baseLatencyMs !== c.baseLatencyMs) {
      changes.push(`baseLatency: ${b.baseLatencyMs} -> ${c.baseLatencyMs}ms`);
    }
    if (b.maxConnectionsPerReplica !== c.maxConnectionsPerReplica) {
      changes.push(
        `maxConnections: ${b.maxConnectionsPerReplica} -> ${c.maxConnectionsPerReplica}`
      );
    }
    if (b.replicationMode !== c.replicationMode) {
      changes.push(`replication: ${b.replicationMode} -> ${c.replicationMode}`);
    }
    if (b.cacheStrategy !== c.cacheStrategy) {
      changes.push(`cacheStrategy: ${b.cacheStrategy} -> ${c.cacheStrategy}`);
    }
    if (b.cacheHitRatio !== c.cacheHitRatio) {
      changes.push(
        `cacheHitRatio: ${Math.round(b.cacheHitRatio * 100)}% -> ${Math.round(c.cacheHitRatio * 100)}%`
      );
    }
    if (b.failureDomain !== c.failureDomain || b.multiAz !== c.multiAz || b.region !== c.region) {
      changes.push(
        `topology: ${b.region}/${b.failureDomain}(multiAz=${b.multiAz}) -> ${c.region}/${c.failureDomain}(multiAz=${c.multiAz})`
      );
    }
    if (b.hasBackup !== c.hasBackup) {
      changes.push(`backup: ${b.hasBackup} -> ${c.hasBackup}`);
    }
    if (changes.length > 0) {
      modifiedComponents.push({ componentId: id, changes });
    }
  }

  for (const id of baseCompMap.keys()) {
    if (!candCompMap.has(id)) {
      removedComponents.push(id);
    }
  }

  const changedEdges: string[] = [];
  const baseEdges = new Map(baseline.edges.map((e) => [e.id, e]));
  const candEdges = new Map(candidate.edges.map((e) => [e.id, e]));

  for (const [eid, e] of candEdges) {
    const be = baseEdges.get(eid);
    if (!be) {
      changedEdges.push(`+edge ${e.source}->${e.target} (${e.communicationMode})`);
    } else if (
      be.communicationMode !== e.communicationMode ||
      be.retryFactor !== e.retryFactor
    ) {
      changedEdges.push(
        `~edge ${eid}: mode ${be.communicationMode}->${e.communicationMode}, retry ${be.retryFactor}->${e.retryFactor}`
      );
    }
  }
  for (const [eid, be] of baseEdges) {
    if (!candEdges.has(eid)) {
      changedEdges.push(`-edge ${be.source}->${be.target}`);
    }
  }

  const policyChanges: string[] = [];
  if (baseline.routingPolicy !== candidate.routingPolicy) {
    policyChanges.push(
      `routing: ${baseline.routingPolicy} -> ${candidate.routingPolicy}`
    );
  }
  if (baseline.scalingMode !== candidate.scalingMode) {
    policyChanges.push(
      `scaling: ${baseline.scalingMode} -> ${candidate.scalingMode}`
    );
  }

  const summary =
    addedComponents.length === 0 &&
    removedComponents.length === 0 &&
    modifiedComponents.length === 0 &&
    changedEdges.length === 0 &&
    policyChanges.length === 0
      ? "Identical architecture revision hashes."
      : `${addedComponents.length} added, ${removedComponents.length} removed, ${modifiedComponents.length} modified component(s), ${changedEdges.length} edge change(s), ${policyChanges.length} policy change(s).`;

  return {
    baselineHash: baseline.contentHash,
    candidateHash: candidate.contentHash,
    addedComponents,
    removedComponents,
    modifiedComponents,
    changedEdges,
    policyChanges,
    summary,
  };
}

