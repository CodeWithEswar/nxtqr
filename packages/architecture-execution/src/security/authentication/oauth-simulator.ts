import type {
  OAuthScenarioConfig,
  OAuthStepOutcome,
  Principal,
} from "../security-schemas";

export interface OAuthFlowResult {
  success: boolean;
  flowType: string;
  steps: OAuthStepOutcome[];
  issuedAccessToken?: string;
  issuedIdToken?: string;
  principal?: Principal;
  failureReason?: string;
}

export class OAuthSimulator {
  public static simulateFlow(
    config: OAuthScenarioConfig,
    virtualClockMs: number
  ): OAuthFlowResult {
    const steps: OAuthStepOutcome[] = [];

    if (config.flowType === "authorization_code_pkce") {
      // Step 1: Authorization Request with PKCE
      steps.push({
        step: "authorization_request",
        succeeded: true,
        timestampMs: virtualClockMs,
        explanation: `Client '${config.clientId}' generated PKCE challenge '${config.pkceCodeChallenge || "SHA256(verifier)"}' and redirected user to IdP.`,
      });

      // Step 2: User Authentication & Consent
      if (!config.authorizationGranted) {
        steps.push({
          step: "consent",
          succeeded: false,
          timestampMs: virtualClockMs + 20,
          explanation: "Resource owner denied authorization request or IdP login failed.",
        });
        return {
          success: false,
          flowType: config.flowType,
          steps,
          failureReason: "OAUTH_ACCESS_DENIED",
        };
      }

      steps.push({
        step: "consent",
        succeeded: true,
        timestampMs: virtualClockMs + 20,
        explanation: "User authenticated with IdP and granted requested scopes [" + config.scopes.join(", ") + "].",
      });

      // Step 3: Authorization Code Exchange with Code Verifier
      const code = "auth_code_" + Math.random().toString(36).substring(2, 9);
      steps.push({
        step: "code_exchange",
        succeeded: true,
        timestampMs: virtualClockMs + 40,
        explanation: `Authorization code '${code}' exchanged at /oauth/token with PKCE verifier '${config.pkceCodeVerifier || "plain_verifier"}'.`,
      });

      // Step 4: Token Verification & Issuance
      const token = config.tokenEndpointResponse?.accessToken || "nxt_access_token_jwt";
      const idToken = config.tokenEndpointResponse?.idToken || "nxt_id_token_jwt";

      steps.push({
        step: "token_verification",
        succeeded: true,
        timestampMs: virtualClockMs + 60,
        explanation: `IdP issued Access Token (Bearer) and OpenID Connect ID Token for user subject.`,
      });

      steps.push({
        step: "resource_access",
        succeeded: true,
        timestampMs: virtualClockMs + 80,
        explanation: `API Gateway accepts Bearer token with scopes [${config.scopes.join(", ")}].`,
      });

      const principal: Principal = {
        id: "usr_oauth_" + config.clientId,
        isAuthenticated: true,
        authMethod: "oauth",
        roles: ["oauth_user"],
        permissions: config.scopes,
        attributes: {
          clientId: config.clientId,
          flow: "authorization_code_pkce",
          idTokenPresent: Boolean(idToken),
        },
        scopes: config.scopes,
      };

      return {
        success: true,
        flowType: config.flowType,
        steps,
        issuedAccessToken: token,
        issuedIdToken: idToken,
        principal,
      };
    }

    // Client Credentials Flow
    steps.push({
      step: "token_verification",
      succeeded: true,
      timestampMs: virtualClockMs,
      explanation: `Machine client '${config.clientId}' authenticated directly to token endpoint with secure client credentials.`,
    });

    const token = config.tokenEndpointResponse?.accessToken || "nxt_m2m_access_token";

    steps.push({
      step: "resource_access",
      succeeded: true,
      timestampMs: virtualClockMs + 20,
      explanation: `Issued service access token with scopes [${config.scopes.join(", ")}].`,
    });

    const principal: Principal = {
      id: "service_" + config.clientId,
      isAuthenticated: true,
      authMethod: "oauth",
      roles: ["service_account"],
      permissions: config.scopes,
      attributes: {
        clientId: config.clientId,
        flow: "client_credentials",
      },
      scopes: config.scopes,
    };

    return {
      success: true,
      flowType: config.flowType,
      steps,
      issuedAccessToken: token,
      principal,
    };
  }
}
