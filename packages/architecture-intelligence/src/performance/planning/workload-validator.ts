import type {
  BenchmarkOperation,
  WorkloadProfile,
} from "../contracts/performance.types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class WorkloadValidator {
  public static validate(
    profile: WorkloadProfile,
    operations: BenchmarkOperation[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Operations Validation
    if (!operations || operations.length === 0) {
      errors.push("At least one benchmark operation is required.");
    } else {
      let totalWeight = 0;
      for (const op of operations) {
        if (!op.path || op.path.trim().length === 0) {
          errors.push(`Operation '${op.name || op.id}' must specify a valid path.`);
        } else if (!op.path.startsWith("/") && !op.path.startsWith("http")) {
          errors.push(`Operation path '${op.path}' must start with '/' or 'http'.`);
        }

        if (op.weight <= 0) {
          errors.push(`Operation '${op.name}' weight must be greater than zero.`);
        }
        totalWeight += op.weight;
      }

      if (Math.abs(totalWeight - 100) > 0.1 && totalWeight > 0) {
        warnings.push(
          `Operation weights sum to ${totalWeight.toFixed(1)}% instead of 100%. Weights will be normalized.`
        );
      }
    }

    // 2. Profile Validation
    if (!profile.stages || profile.stages.length === 0) {
      errors.push("Workload profile must contain at least one stage.");
      return { valid: errors.length === 0, errors, warnings };
    }

    let totalDurationSeconds = 0;
    for (let i = 0; i < profile.stages.length; i++) {
      const stage = profile.stages[i];
      if (stage.durationSeconds <= 0) {
        errors.push(`Stage [${i + 1}] '${stage.name}' duration must be positive.`);
      }
      totalDurationSeconds += stage.durationSeconds;
    }

    if (totalDurationSeconds > 86400 * 7) {
      errors.push("Total workload duration exceeds maximum allowable horizon (7 days).");
    }

    // Closed-loop specifics
    if (profile.modelType === "closed_loop") {
      if (profile.maxVUs <= 0) {
        errors.push("Closed-loop profile maxVUs must be greater than 0.");
      }
      if (profile.initialVUs < 0) {
        errors.push("Closed-loop profile initialVUs cannot be negative.");
      }
      if (profile.initialVUs > profile.maxVUs) {
        errors.push("Closed-loop initialVUs cannot exceed maxVUs.");
      }
      if (profile.thinkTimeMs.min < 0 || profile.thinkTimeMs.max < profile.thinkTimeMs.min) {
        errors.push("Closed-loop thinkTimeMs max must be >= min, and min cannot be negative.");
      }

      for (const stage of profile.stages) {
        if (stage.targetVUs !== undefined && stage.targetVUs > profile.maxVUs) {
          errors.push(
            `Stage '${stage.name}' targetVUs (${stage.targetVUs}) exceeds profile maxVUs (${profile.maxVUs}).`
          );
        }
      }
    }

    // Open-loop specifics
    if (profile.modelType === "open_loop") {
      if (profile.targetRps <= 0) {
        errors.push("Open-loop targetRps must be greater than 0.");
      }
      if (profile.maxExecutionCapacityVUs <= 0) {
        errors.push("Open-loop maxExecutionCapacityVUs must be positive.");
      }
      if (profile.allocatedVUs <= 0) {
        errors.push("Open-loop allocatedVUs must be positive.");
      }
      if (profile.allocatedVUs > profile.maxExecutionCapacityVUs) {
        warnings.push(
          "Allocated VUs exceeds maxExecutionCapacityVUs. Capacity ceiling will constrain concurrent execution."
        );
      }
    }

    // Stage flow checks
    const firstStage = profile.stages[0];
    if (firstStage && firstStage.stageType !== "warmup" && firstStage.stageType !== "baseline") {
      warnings.push(
        `Initial stage is '${firstStage.stageType}'. A 'warmup' or 'baseline' stage is recommended to avoid cold-start measurement bias.`
      );
    }

    const lastStage = profile.stages[profile.stages.length - 1];
    if (lastStage && lastStage.stageType !== "cooldown" && lastStage.stageType !== "recovery") {
      warnings.push(
        "Final stage is not a 'cooldown' or 'recovery' stage. Abrupt test termination may truncate inflight requests."
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public static normalizeOperationWeights(
    operations: BenchmarkOperation[]
  ): BenchmarkOperation[] {
    if (!operations || operations.length === 0) return [];
    const sum = operations.reduce((acc, op) => acc + (op.weight > 0 ? op.weight : 0), 0);
    if (sum === 0) {
      const equalWeight = 100 / operations.length;
      return operations.map((op) => ({ ...op, weight: equalWeight }));
    }

    return operations.map((op) => ({
      ...op,
      weight: Number(((Math.max(0, op.weight) / sum) * 100).toFixed(2)),
    }));
  }
}
