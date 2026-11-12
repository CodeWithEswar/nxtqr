import type {
  ApiKeyValidationScenario,
  Principal,
} from "../security-schemas";

export interface ApiKeyValidationResult {
  valid: boolean;
  principal?: Principal;
  failureReasonCode?: string;
  explanation: string;
}

export class ApiKeySimulator {
  public static validateKey(
    scenario: ApiKeyValidationScenario,
    virtualClockMs: number
  ): ApiKeyValidationResult {
    // 1. Presence Check
    if (!scenario.keyPresent) {
      return {
        valid: false,
        failureReasonCode: "API_KEY_MISSING",
        explanation: `API key header '${scenario.keyHeaderName}' is missing from incoming request.`,
      };
    }

    // 2. Format / Validity Check
    if (!scenario.isValid) {
      return {
        valid: false,
        failureReasonCode: "API_KEY_INVALID",
        explanation: "API key was not recognized by security registry.",
      };
    }

    // 3. Revocation Check
    if (scenario.isRevoked) {
      return {
        valid: false,
        failureReasonCode: "API_KEY_REVOKED",
        explanation: "API key has been revoked by workspace security administrator.",
      };
    }

    // 4. Virtual Expiration Check
    if (scenario.expiresAtMs !== undefined && virtualClockMs >= scenario.expiresAtMs) {
      return {
        valid: false,
        failureReasonCode: "API_KEY_EXPIRED",
        explanation: `API key expired at virtual time ${scenario.expiresAtMs}ms (current: ${virtualClockMs}ms).`,
      };
    }

    // Success: construct principal
    const principalId = scenario.associatedPrincipalId || "principal_api_client";
    const principal: Principal = {
      id: principalId,
      isAuthenticated: true,
      authMethod: "apikey",
      roles: ["api_consumer"],
      permissions: scenario.allowedScopes || ["read", "write"],
      attributes: {
        keyType: "server_to_server",
        keyPrefix: scenario.keyValuePreview?.slice(0, 7) || "nxt_live",
      },
      scopes: scenario.allowedScopes || ["read"],
    };

    return {
      valid: true,
      principal,
      explanation: `API key validated successfully for principal '${principalId}'.`,
    };
  }
}
