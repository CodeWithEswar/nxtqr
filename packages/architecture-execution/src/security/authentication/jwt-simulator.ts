import type {
  JwtValidationScenario,
  Principal,
} from "../security-schemas";

export interface JwtStepResult {
  stepNumber: number;
  stepName: string;
  passed: boolean;
  explanation: string;
}

export interface JwtValidationResult {
  valid: boolean;
  steps: JwtStepResult[];
  principal?: Principal;
  failureReasonCode?: string;
  failureExplanation?: string;
}

export class JwtSimulator {
  /**
   * Deterministically evaluates a modeled JWT validation scenario against virtual clock time.
   * Emits step-by-step diagnostic verdicts without executing live cryptography.
   */
  public static validateToken(
    scenario: JwtValidationScenario,
    virtualClockMs: number
  ): JwtValidationResult {
    const steps: JwtStepResult[] = [];

    // Step 1: Token Presence
    if (!scenario.tokenPresent) {
      steps.push({
        stepNumber: 1,
        stepName: "Token Presence",
        passed: false,
        explanation: "No Bearer authorization token was found in request headers.",
      });
      return {
        valid: false,
        steps,
        failureReasonCode: "TOKEN_MISSING",
        failureExplanation: "Bearer token missing from Authorization header.",
      };
    }
    steps.push({
      stepNumber: 1,
      stepName: "Token Presence",
      passed: true,
      explanation: "Bearer token detected in Authorization header.",
    });

    // Step 2: Token Structure (Header.Payload.Signature)
    if (!scenario.structureValid) {
      steps.push({
        stepNumber: 2,
        stepName: "Token Structure",
        passed: false,
        explanation: "Malformed JWT: expected 3 dot-separated Base64URL segments.",
      });
      return {
        valid: false,
        steps,
        failureReasonCode: "TOKEN_MALFORMED",
        failureExplanation: "Token structure is invalid (missing segments).",
      };
    }
    steps.push({
      stepNumber: 2,
      stepName: "Token Structure",
      passed: true,
      explanation: "Valid 3-part Base64URL JWT format.",
    });

    // Step 3: Signature Validity (Modeled Input)
    if (!scenario.signatureValid) {
      steps.push({
        stepNumber: 3,
        stepName: "Signature Verification",
        passed: false,
        explanation: "Digital signature does not match public key or token was tampered with (Modeled Verification).",
      });
      return {
        valid: false,
        steps,
        failureReasonCode: "INVALID_SIGNATURE",
        failureExplanation: "Cryptographic signature validation failed.",
      };
    }
    steps.push({
      stepNumber: 3,
      stepName: "Signature Verification",
      passed: true,
      explanation: "Digital signature verified against IdP JWKS (Modeled Verification).",
    });

    // Step 4: Algorithm Allowlist
    if (!scenario.algorithmAllowed) {
      steps.push({
        stepNumber: 4,
        stepName: "Algorithm Allowlist",
        passed: false,
        explanation: "Disallowed signing algorithm (e.g. 'none' or unapproved symmetric HMAC).",
      });
      return {
        valid: false,
        steps,
        failureReasonCode: "DISALLOWED_ALGORITHM",
        failureExplanation: "Token header specifies an algorithm outside the gateway allowlist.",
      };
    }
    steps.push({
      stepNumber: 4,
      stepName: "Algorithm Allowlist",
      passed: true,
      explanation: "Algorithm is permitted (RS256/ES256).",
    });

    // Step 5: Issuer (iss) Validation
    if (scenario.expectedIssuer !== scenario.actualIssuer) {
      steps.push({
        stepNumber: 5,
        stepName: "Issuer Validation",
        passed: false,
        explanation: `Issuer mismatch: expected '${scenario.expectedIssuer}', received '${scenario.actualIssuer}'.`,
      });
      return {
        valid: false,
        steps,
        failureReasonCode: "WRONG_ISSUER",
        failureExplanation: `Token issuer '${scenario.actualIssuer}' does not match expected authority.`,
      };
    }
    steps.push({
      stepNumber: 5,
      stepName: "Issuer Validation",
      passed: true,
      explanation: `Issuer verified: '${scenario.actualIssuer}'.`,
    });

    // Step 6: Audience (aud) Validation
    if (scenario.expectedAudience !== scenario.actualAudience) {
      steps.push({
        stepNumber: 6,
        stepName: "Audience Validation",
        passed: false,
        explanation: `Audience mismatch: expected '${scenario.expectedAudience}', received '${scenario.actualAudience}'.`,
      });
      return {
        valid: false,
        steps,
        failureReasonCode: "WRONG_AUDIENCE",
        failureExplanation: `Token audience '${scenario.actualAudience}' is not authorized for this API.`,
      };
    }
    steps.push({
      stepNumber: 6,
      stepName: "Audience Validation",
      passed: true,
      explanation: `Audience verified: '${scenario.actualAudience}'.`,
    });

    // Step 7: Expiration (exp) Virtual Clock Check
    if (scenario.expiresAtMs !== undefined && virtualClockMs >= scenario.expiresAtMs) {
      const elapsed = virtualClockMs - scenario.expiresAtMs;
      steps.push({
        stepNumber: 7,
        stepName: "Expiration (exp)",
        passed: false,
        explanation: `Token expired: expired at ${scenario.expiresAtMs}ms (current: ${virtualClockMs}ms, +${elapsed}ms past expiration).`,
      });
      return {
        valid: false,
        steps,
        failureReasonCode: "TOKEN_EXPIRED",
        failureExplanation: `JWT expired ${elapsed}ms ago at virtual time ${scenario.expiresAtMs}ms.`,
      };
    }
    steps.push({
      stepNumber: 7,
      stepName: "Expiration (exp)",
      passed: true,
      explanation: `Token is active (expires at ${scenario.expiresAtMs || "infinity"}ms virtual).`,
    });

    // Step 8: Not-Before (nbf) Virtual Clock Check
    if (scenario.notBeforeMs !== undefined && virtualClockMs < scenario.notBeforeMs) {
      steps.push({
        stepNumber: 8,
        stepName: "Not-Before (nbf)",
        passed: false,
        explanation: `Token not yet valid: active starting at ${scenario.notBeforeMs}ms (current: ${virtualClockMs}ms).`,
      });
      return {
        valid: false,
        steps,
        failureReasonCode: "TOKEN_NOT_YET_VALID",
        failureExplanation: `Token cannot be accepted before virtual time ${scenario.notBeforeMs}ms.`,
      };
    }
    steps.push({
      stepNumber: 8,
      stepName: "Not-Before (nbf)",
      passed: true,
      explanation: "Token nbf constraint satisfied.",
    });

    // Step 9 & 10: Subject & Scope/Claims Extraction
    const subject = scenario.subject || String(scenario.claims.sub || "sub_anonymous_user");
    const roles = Array.isArray(scenario.claims.roles)
      ? (scenario.claims.roles as string[])
      : scenario.claims.role ? [String(scenario.claims.role)] : ["user"];
    const permissions = Array.isArray(scenario.claims.permissions)
      ? (scenario.claims.permissions as string[])
      : [];
    const scopes = Array.isArray(scenario.claims.scope)
      ? (scenario.claims.scope as string[])
      : typeof scenario.claims.scope === "string"
        ? (scenario.claims.scope as string).split(" ")
        : [];
    const tenantId = scenario.claims.tenant_id ? String(scenario.claims.tenant_id) : undefined;

    steps.push({
      stepNumber: 9,
      stepName: "Subject Extraction",
      passed: true,
      explanation: `Extracted subject principal ID: '${subject}'.`,
    });

    steps.push({
      stepNumber: 10,
      stepName: "Claims & Scopes Binding",
      passed: true,
      explanation: `Bound roles [${roles.join(", ")}], scopes [${scopes.join(", ")}], tenant: ${tenantId || "none"}.`,
    });

    const principal: Principal = {
      id: subject,
      isAuthenticated: true,
      authMethod: "jwt",
      roles,
      permissions,
      attributes: { ...scenario.claims },
      tenantId,
      scopes,
      tokenIssuer: scenario.actualIssuer,
    };

    return {
      valid: true,
      steps,
      principal,
    };
  }
}
