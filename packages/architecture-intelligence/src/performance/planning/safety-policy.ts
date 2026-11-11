export interface SafetyPolicyOptions {
  maxAllowedVUs?: number;
  maxAllowedRps?: number;
  maxDurationSeconds?: number;
  allowPrivateNetworkTargets?: boolean;
}

export interface SafetyCheckResult {
  isSafe: boolean;
  violations: string[];
  warnings: string[];
}

export class PerformanceSafetyPolicy {
  private readonly maxAllowedVUs: number;
  private readonly maxAllowedRps: number;
  private readonly maxDurationSeconds: number;
  private readonly allowPrivateNetworkTargets: boolean;

  // Blocked addresses for SSRF protection
  private static readonly BLOCKED_HOSTS = new Set([
    "localhost",
    "127.0.0.1",
    "::1",
    "169.254.169.254", // Cloud metadata
    "metadata.google.internal",
    "instance-data",
  ]);

  constructor(options: SafetyPolicyOptions = {}) {
    this.maxAllowedVUs = options.maxAllowedVUs ?? 5000;
    this.maxAllowedRps = options.maxAllowedRps ?? 20000;
    this.maxDurationSeconds = options.maxDurationSeconds ?? 86400; // 24h
    this.allowPrivateNetworkTargets = options.allowPrivateNetworkTargets ?? false;
  }

  public evaluateTargetHost(targetHost: string): { isValid: boolean; reason?: string } {
    if (!targetHost || targetHost.trim().length === 0) {
      return { isValid: false, reason: "Target host cannot be empty." };
    }

    try {
      // Normalize URL
      const urlStr = targetHost.startsWith("http://") || targetHost.startsWith("https://")
        ? targetHost
        : `https://${targetHost}`;
      const parsed = new URL(urlStr);
      const cleanHost = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();

      if (PerformanceSafetyPolicy.BLOCKED_HOSTS.has(cleanHost)) {
        if (!this.allowPrivateNetworkTargets) {
          return {
            isValid: false,
            reason: `Target host '${cleanHost}' is a restricted local or cloud-metadata address.`,
          };
        }
      }

      // Check RFC1918 private IPv4 ranges if private targets disallowed
      if (!this.allowPrivateNetworkTargets) {
        if (
          cleanHost.startsWith("10.") ||
          cleanHost.startsWith("192.168.") ||
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanHost)
        ) {
          return {
            isValid: false,
            reason: `Target host '${cleanHost}' is a private RFC1918 network address. Enable 'allowPrivateNetworkTargets' for isolated staging VPCs.`,
          };
        }
      }

      return { isValid: true };
    } catch {
      return { isValid: false, reason: `Invalid target host format: '${targetHost}'.` };
    }
  }

  public validatePlan(params: {
    targetHost: string;
    totalVUs?: number;
    targetRps?: number;
    durationSeconds: number;
  }): SafetyCheckResult {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Host check
    const hostCheck = this.evaluateTargetHost(params.targetHost);
    if (!hostCheck.isValid && hostCheck.reason) {
      violations.push(hostCheck.reason);
    }

    // VU check
    if (params.totalVUs !== undefined && params.totalVUs > this.maxAllowedVUs) {
      violations.push(
        `Planned concurrency of ${params.totalVUs} VUs exceeds maximum safety ceiling (${this.maxAllowedVUs} VUs).`
      );
    }

    // RPS check
    if (params.targetRps !== undefined && params.targetRps > this.maxAllowedRps) {
      violations.push(
        `Planned arrival rate of ${params.targetRps} RPS exceeds maximum safety ceiling (${this.maxAllowedRps} RPS).`
      );
    }

    // Duration check
    if (params.durationSeconds > this.maxDurationSeconds) {
      violations.push(
        `Test duration of ${params.durationSeconds}s exceeds safety ceiling (${this.maxDurationSeconds}s).`
      );
    }

    // High load warning
    if (params.totalVUs && params.totalVUs >= 1000) {
      warnings.push(
        `High load plan (${params.totalVUs} VUs): Ensure test generator infrastructure has sufficient sockets and CPU to prevent client-side saturation.`
      );
    }

    return {
      isSafe: violations.length === 0,
      violations,
      warnings,
    };
  }
}
