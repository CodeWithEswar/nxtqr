import {
  EstimationInputSchema,
  type ApiDesignArtifact,
  type DataModelArtifact,
  type EstimationArtifact,
  type EstimationInput,
  type RequirementClassification,
  type SystemDesignChallenge,
} from "../practice-schemas";

const UNIT_MULTIPLIERS: Record<EstimationInput["payloadUnit"], number> = {
  bytes: 1,
  KB: 1024,
  MB: 1024 * 1024,
};

export function discoverRequirementsFromQuestion(params: {
  challenge: SystemDesignChallenge;
  questionText: string;
  alreadyDiscoveredIds: string[];
}): {
  matchedRuleIds: string[];
  newlyDiscoveredIds: string[];
  allDiscoveredIds: string[];
  interviewerResponse: string;
} {
  const { challenge, questionText, alreadyDiscoveredIds } = params;
  const q = questionText.toLowerCase();
  const discoveredSet = new Set<string>(alreadyDiscoveredIds);

  for (const r of challenge.requirements) {
    if (r.discoveredByDefault) discoveredSet.add(r.id);
  }

  const matchedRules = challenge.discoveryRules.filter((rule) =>
    rule.triggerKeywords.some((kw) => q.includes(kw.toLowerCase()))
  );

  const newlyDiscovered: string[] = [];
  const responseParts: string[] = [];

  for (const rule of matchedRules) {
    responseParts.push(rule.interviewerResponse);
    for (const reqId of rule.revealsRequirementIds) {
      if (!discoveredSet.has(reqId)) {
        discoveredSet.add(reqId);
        newlyDiscovered.push(reqId);
      }
    }
  }

  if (matchedRules.length === 0) {
    return {
      matchedRuleIds: [],
      newlyDiscoveredIds: [],
      allDiscoveredIds: Array.from(discoveredSet),
      interviewerResponse:
        "Good clarification angle. Try asking specifically about daily scale/QPS/latency, core API/retention scope, or availability/regional failure tolerance.",
    };
  }

  return {
    matchedRuleIds: matchedRules.map((r) => r.id),
    newlyDiscoveredIds: newlyDiscovered,
    allDiscoveredIds: Array.from(discoveredSet),
    interviewerResponse: responseParts.join(" "),
  };
}

export function classifyRequirement(
  classifications: Record<string, RequirementClassification>,
  requirementId: string,
  kind: RequirementClassification
): Record<string, RequirementClassification> {
  return {
    ...classifications,
    [requirementId]: kind,
  };
}

export function computeCapacityEstimation(rawInput: EstimationInput): EstimationArtifact {
  const parsed = EstimationInputSchema.safeParse(rawInput);
  const warnings: string[] = [];

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      warnings.push(`${issue.path.join(".")}: ${issue.message}`);
    }
    return {
      input: rawInput,
      averageRps: 0,
      peakRps: 0,
      dailyWriteRequests: 0,
      dailyStorageBytes: 0,
      retentionStorageBytes: 0,
      replicatedStorageBytes: 0,
      bandwidthMbps: 0,
      formattedStorageGb: 0,
      formattedReplicatedTb: 0,
      warnings,
      valid: false,
      caveat:
        "Simplified estimate excludes index B-tree bloat, WAL logs, replication metadata, and snapshot overhead.",
    };
  }

  const input = parsed.data;
  const payloadBytes = input.avgPayloadSize * UNIT_MULTIPLIERS[input.payloadUnit];

  if (input.dailyActiveUsers === 0 || input.requestsPerUserPerDay === 0) {
    warnings.push("DAU or requests/user/day is zero; throughput estimates evaluate to 0 RPS.");
  }
  if (!input.assumptionsNote.trim()) {
    warnings.push("Document assumptions explicitly (e.g., payload composition, peak window duration).");
  }
  if (input.peakMultiplier > 50) {
    warnings.push("Peak multiplier > 50x is extreme; verify burst justification.");
  }

  const totalDailyRequests = input.dailyActiveUsers * input.requestsPerUserPerDay;
  const averageRps = Number((totalDailyRequests / 86_400).toFixed(2));
  const peakRps = Number((averageRps * input.peakMultiplier).toFixed(2));

  // Read/write ratio = reads per 1 write => write fraction = 1 / (readWriteRatio + 1)
  const writeFraction = 1 / (input.readWriteRatio + 1);
  const dailyWriteRequests = Math.round(totalDailyRequests * writeFraction);
  const dailyStorageBytes = Math.round(dailyWriteRequests * payloadBytes);
  const retentionStorageBytes = dailyStorageBytes * input.retentionDays;
  const replicatedStorageBytes = retentionStorageBytes * input.replicationFactor;

  if (!Number.isFinite(replicatedStorageBytes) || replicatedStorageBytes > 1e18) {
    warnings.push("Estimated storage exceeds 1 Exabyte; verify retention or payload units.");
  }

  const bandwidthBytesPerSec = peakRps * payloadBytes;
  const bandwidthMbps = Number(((bandwidthBytesPerSec * 8) / 1_000_000).toFixed(2));
  const formattedStorageGb = Number((retentionStorageBytes / 1_000_000_000).toFixed(2));
  const formattedReplicatedTb = Number((replicatedStorageBytes / 1_000_000_000_000).toFixed(3));

  return {
    input,
    averageRps,
    peakRps,
    dailyWriteRequests,
    dailyStorageBytes,
    retentionStorageBytes,
    replicatedStorageBytes,
    bandwidthMbps,
    formattedStorageGb,
    formattedReplicatedTb,
    warnings,
    valid: Number.isFinite(peakRps) && Number.isFinite(replicatedStorageBytes),
    caveat:
      "Simplified baseline formula excludes database index overhead, TLS framing, compression ratios, and operational headroom.",
  };
}

export function evaluateApiDesignCoverage(
  apiDesign: ApiDesignArtifact,
  challenge: SystemDesignChallenge
): {
  score: 0 | 1 | 2 | 3;
  missingCapabilities: string[];
  details: string;
} {
  if (apiDesign.endpoints.length === 0) {
    return {
      score: 0,
      missingCapabilities: challenge.evaluatorOnly.requiredApiCapabilities,
      details: "No API endpoints defined.",
    };
  }

  const missing: string[] = [];
  for (const cap of challenge.evaluatorOnly.requiredApiCapabilities) {
    if (cap === "GET" || cap === "POST" || cap === "PUT" || cap === "DELETE" || cap === "PATCH") {
      if (!apiDesign.endpoints.some((e) => e.method === cap)) missing.push(`HTTP ${cap} endpoint`);
    } else if (cap === "authRequired") {
      if (!apiDesign.endpoints.some((e) => e.authRequired)) missing.push("authenticated boundary");
    } else if (cap === "idempotent") {
      const hasWrite = apiDesign.endpoints.some((e) => e.method === "POST" || e.method === "PUT");
      if (hasWrite && !apiDesign.endpoints.some((e) => e.idempotent)) {
        missing.push("write idempotency support");
      }
    } else if (cap === "paginated") {
      if (!apiDesign.endpoints.some((e) => e.paginated)) missing.push("cursor/offset pagination");
    } else if (cap === "rateLimited") {
      if (!apiDesign.endpoints.some((e) => e.rateLimited)) missing.push("rate limit enforcement");
    }
  }

  const hasErrorContracts = apiDesign.endpoints.every((e) => e.errorCodes.length >= 2);
  if (!hasErrorContracts) missing.push("structured error status contracts");

  if (missing.length === 0) {
    return {
      score: 3,
      missingCapabilities: [],
      details: `${apiDesign.endpoints.length} endpoints cover all required HTTP semantics, auth, error handling, and protection controls.`,
    };
  }
  if (missing.length === 1) {
    return {
      score: 2,
      missingCapabilities: missing,
      details: `API contract covers core flow; minor gap: ${missing[0]}.`,
    };
  }
  return {
    score: 1,
    missingCapabilities: missing,
    details: `API contract defined (${apiDesign.endpoints.length} endpoints) but lacks: ${missing.join(", ")}.`,
  };
}

export function evaluateDataModelCoverage(
  dataModel: DataModelArtifact,
  challenge: SystemDesignChallenge
): {
  score: 0 | 1 | 2 | 3;
  missingAreas: string[];
  details: string;
} {
  if (dataModel.entities.length === 0) {
    return {
      score: 0,
      missingAreas: ["data entities"],
      details: "No data entities or storage strategies defined.",
    };
  }

  const missing: string[] = [];
  if (dataModel.entities.length < challenge.evaluatorOnly.requiredEntityConcepts.length) {
    missing.push(
      `core domain entities (expected at least ${challenge.evaluatorOnly.requiredEntityConcepts.length})`
    );
  }
  if (!dataModel.entities.some((e) => e.indexes.length > 0)) {
    missing.push("secondary/query access-pattern indexes");
  }
  if (!dataModel.entities.some((e) => Boolean(e.partitionKey && e.partitionKey.trim().length > 0))) {
    missing.push("sharding/partition key strategy");
  }
  if (dataModel.entities.every((e) => e.replicationMode === "single")) {
    missing.push("fault-tolerant database replication mode");
  }

  if (missing.length === 0) {
    return {
      score: 3,
      missingAreas: [],
      details: `${dataModel.entities.length} entities include PKs, partition keys, access indexes, retention, and multi-copy replication.`,
    };
  }
  if (missing.length === 1) {
    return {
      score: 2,
      missingAreas: missing,
      details: `Data model is functional; consider tightening: ${missing[0]}.`,
    };
  }
  return {
    score: 1,
    missingAreas: missing,
    details: `Data model omits: ${missing.join(", ")}.`,
  };
}

