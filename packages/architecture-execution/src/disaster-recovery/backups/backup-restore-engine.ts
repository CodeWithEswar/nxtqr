import type {
  BackupArtifact,
  BackupChainValidation,
  BackupPolicyConfig,
  RegionRuntimeStatus,
  RestoreOperation,
} from "../disaster-recovery-schemas";

export function createScheduledBackup(params: {
  policy: BackupPolicyConfig;
  nowMs: number;
  durableLsn: number;
  existingBackups: BackupArtifact[];
  corruptOverride: boolean;
  skipForMissingChainFault: boolean;
}): {
  artifact: BackupArtifact | null;
  prunedIds: string[];
} {
  const {
    policy,
    nowMs,
    durableLsn,
    existingBackups,
    corruptOverride,
    skipForMissingChainFault,
  } = params;

  const fullBackups = existingBackups.filter(
    (b) => b.datasetId === policy.datasetId && b.type === "full" && b.retained
  );
  const latestFull = fullBackups[fullBackups.length - 1];

  const isFirstOrFull =
    existingBackups.filter((b) => b.datasetId === policy.datasetId).length === 0 ||
    policy.backupType === "full";

  const type = isFirstOrFull ? "full" : policy.backupType;
  const datasetBackups = existingBackups.filter(
    (b) => b.datasetId === policy.datasetId && b.retained
  );
  const prevBackup = datasetBackups[datasetBackups.length - 1];

  const backupNum = existingBackups.length + 1;
  const id = `bkp_${backupNum}_${type}`;

  // Allow synthetic simulation of a missing intermediate incremental link
  if (skipForMissingChainFault && type === "incremental" && backupNum === 2) {
    return { artifact: null, prunedIds: [] };
  }

  const corrupt = corruptOverride || policy.corruptNextBackup;

  const artifact: BackupArtifact = {
    id,
    datasetId: policy.datasetId,
    type,
    createdAtMs: nowMs,
    completedAtMs: nowMs + 10,
    baseBackupId: type === "full" ? undefined : latestFull?.id,
    parentBackupId:
      type === "full"
        ? undefined
        : type === "differential"
          ? latestFull?.id
          : prevBackup?.id ?? latestFull?.id,
    includedLogPosition: durableLsn,
    integrity: corrupt ? "corrupt" : policy.integrityCheckEnabled ? "valid" : "unknown",
    checksum: corrupt
      ? `BAD_CRC_${id}`
      : `CRC32_${id}_lsn${durableLsn}`,
    storageRegionId: policy.storageRegionId,
    sizeBytes: type === "full" ? 1024 * 64 : Math.max(1024, durableLsn * 512),
    retained: true,
  };

  // Dependency-aware retention: NEVER prune a base full/parent backup still required by retained incrementals
  const prunedIds: string[] = [];
  const retainedAfter = [...existingBackups, artifact].filter((b) => b.retained);
  if (retainedAfter.length > policy.retentionCount) {
    const referencedParents = new Set<string>();
    for (const b of retainedAfter) {
      if (b.baseBackupId) referencedParents.add(b.baseBackupId);
      if (b.parentBackupId) referencedParents.add(b.parentBackupId);
    }
    for (const candidate of retainedAfter) {
      if (
        retainedAfter.length - prunedIds.length <= policy.retentionCount
      ) {
        break;
      }
      if (!referencedParents.has(candidate.id) && candidate.id !== artifact.id) {
        candidate.retained = false;
        prunedIds.push(candidate.id);
      }
    }
  }

  return { artifact, prunedIds };
}

export function validateBackupChain(params: {
  targetBackupId: string;
  backups: BackupArtifact[];
  regions: Record<string, RegionRuntimeStatus>;
  forceMissingIncremental?: boolean;
}): BackupChainValidation {
  const { targetBackupId, backups, regions, forceMissingIncremental } = params;
  const byId = new Map(backups.map((b) => [b.id, b]));
  const chain: BackupArtifact[] = [];
  const missingIds: string[] = [];
  const corruptIds: string[] = [];

  let cursorId: string | undefined = targetBackupId;
  const visited = new Set<string>();

  while (cursorId) {
    if (visited.has(cursorId)) {
      return {
        targetBackupId,
        valid: false,
        chainIds: chain.map((c) => c.id),
        missingIds: [],
        corruptIds: [],
        reason: `Circular parent reference detected at backup '${cursorId}'.`,
      };
    }
    visited.add(cursorId);

    const node = byId.get(cursorId);
    if (!node || !node.retained) {
      missingIds.push(cursorId);
      break;
    }

    const storageReg = regions[node.storageRegionId];
    if (storageReg && storageReg.state === "UNAVAILABLE") {
      missingIds.push(`${node.id}@${node.storageRegionId}`);
      break;
    }

    chain.push(node);
    if (node.integrity === "corrupt") {
      corruptIds.push(node.id);
    }

    if (node.type === "full") {
      cursorId = undefined;
    } else {
      cursorId = node.parentBackupId ?? node.baseBackupId;
      if (!cursorId) {
        missingIds.push("missing_base_full_backup");
      }
    }
  }

  if (forceMissingIncremental) {
    missingIds.push("missing_incremental_segment");
  }

  // Corrupted backups NEVER silently pass
  if (corruptIds.length > 0) {
    return {
      targetBackupId,
      valid: false,
      chainIds: chain.map((c) => c.id).reverse(),
      missingIds,
      corruptIds,
      reason: `Checksum/manifest integrity FAILED on backup(s): ${corruptIds.join(", ")}.`,
    };
  }

  if (missingIds.length > 0 || chain.length === 0) {
    return {
      targetBackupId,
      valid: false,
      chainIds: chain.map((c) => c.id).reverse(),
      missingIds,
      corruptIds,
      reason: `Incomplete backup chain: missing ${missingIds.join(", ") || targetBackupId}.`,
    };
  }

  return {
    targetBackupId,
    valid: true,
    chainIds: chain.map((c) => c.id).reverse(),
    missingIds: [],
    corruptIds: [],
    reason: `Verified complete dependency chain (${chain.length} artifact(s)): ${chain
      .map((c) => c.id)
      .reverse()
      .join(" -> ")}.`,
  };
}

export function advanceRestoreStateMachine(params: {
  restore: RestoreOperation;
  backups: BackupArtifact[];
  regions: Record<string, RegionRuntimeStatus>;
  maxRecoverableLsn: number;
  nowMs: number;
  interruptedFault: boolean;
  missingIncrementalFault: boolean;
}): {
  chainValidation: BackupChainValidation | null;
  progressed: boolean;
  failedReason?: string;
  completed?: boolean;
} {
  const {
    restore,
    backups,
    regions,
    maxRecoverableLsn,
    nowMs,
    interruptedFault,
    missingIncrementalFault,
  } = params;

  if (
    restore.paused ||
    restore.state === "IDLE" ||
    restore.state === "COMPLETED" ||
    restore.state === "FAILED"
  ) {
    return { chainValidation: null, progressed: false };
  }

  if (interruptedFault && restore.state === "REPLAYING_LOGS") {
    restore.state = "PAUSED";
    restore.paused = true;
    restore.failureReason = "Restore interrupted by synthetic storage/network fault.";
    return { chainValidation: null, progressed: true };
  }

  if (restore.state === "REQUESTED") {
    restore.state = "VALIDATING_BACKUP";
    restore.startedAtMs = restore.startedAtMs ?? nowMs;
    const validation = validateBackupChain({
      targetBackupId: restore.backupId,
      backups,
      regions,
      forceMissingIncremental: missingIncrementalFault,
    });
    if (!validation.valid) {
      restore.state = "FAILED";
      restore.integrityVerified = false;
      restore.failureReason = validation.reason;
      return {
        chainValidation: validation,
        progressed: true,
        failedReason: validation.reason,
      };
    }
    restore.integrityVerified = true;
    return { chainValidation: validation, progressed: true };
  }

  if (restore.state === "VALIDATING_BACKUP") {
    restore.state = "PROVISIONING_TARGET";
    return { chainValidation: null, progressed: true };
  }

  if (restore.state === "PROVISIONING_TARGET") {
    restore.state = "RESTORING_SNAPSHOT";
    const targetBkp = backups.find((b) => b.id === restore.backupId);
    const snapLsn = targetBkp?.includedLogPosition ?? 1;
    restore.totalRecordsToRestore = Math.max(snapLsn, restore.targetLsn ?? maxRecoverableLsn);
    restore.recordsRestored = snapLsn;
    return { chainValidation: null, progressed: true };
  }

  if (restore.state === "RESTORING_SNAPSHOT") {
    restore.state = "REPLAYING_LOGS";
    return { chainValidation: null, progressed: true };
  }

  if (restore.state === "REPLAYING_LOGS") {
    // Idempotent log replay up to targetLsn (or maxRecoverableLsn)
    const ceiling =
      restore.targetLsn !== undefined
        ? Math.min(restore.targetLsn, maxRecoverableLsn)
        : maxRecoverableLsn;
    const alreadyApplied = new Set(restore.replayedLsnIds);
    for (let lsn = 1; lsn <= ceiling; lsn++) {
      if (!alreadyApplied.has(lsn)) {
        restore.replayedLsnIds.push(lsn);
      }
    }
    restore.logsAppliedLsn = Math.max(restore.logsAppliedLsn, ceiling);
    restore.recordsRestored = Math.max(restore.recordsRestored, restore.logsAppliedLsn);
    restore.state = "VERIFYING_INTEGRITY";
    return { chainValidation: null, progressed: true };
  }

  if (restore.state === "VERIFYING_INTEGRITY") {
    restore.state = "RESTORING_SERVICES";
    return { chainValidation: null, progressed: true };
  }

  if (restore.state === "RESTORING_SERVICES") {
    restore.state = "COMPLETED";
    restore.completedAtMs = nowMs;
    return { chainValidation: null, progressed: true, completed: true };
  }

  return { chainValidation: null, progressed: false };
}

