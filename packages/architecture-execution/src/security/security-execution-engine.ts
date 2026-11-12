import type {
  ExecutionTrace,
  VisualizationFrame,
} from "../domain/execution-trace";
import type { ModeledRuntimeState } from "../domain/runtime-state";
import { RuntimeStateHelper } from "../domain/runtime-state";
import { DETERMINISTIC_EPOCH_ISO, createDeterministicId } from "../orchestrator/deterministic-id";
import type {
  SecurityScenario,
  ModeledSecurityRuntimeState,
  SecurityMetrics,
  SecurityDecision,
  SecurityResponse,
  Principal,
  GatewaySecurityRoute,
} from "./security-schemas";
import type {
  SecurityExecutionEvent,
  GatewayRouteEvaluationStartedEvent,
  GatewayRouteCandidateCheckedEvent,
  GatewayRouteSelectedEvent,
  GatewayRouteNotFoundEvent,
  WafEvaluationStartedEvent,
  WafAllowedEvent,
  WafBlockedEvent,
  SecurityRateLimitEvaluatedEvent,
  SecurityRateLimitAllowedEvent,
  SecurityRateLimitRejectedEvent,
  AuthStartedEvent,
  AuthSucceededEvent,
  AuthFailedEvent,
  JwtEvaluationStartedEvent,
  JwtStepValidatedEvent,
  JwtStepFailedEvent,
  ApiKeyLookupStartedEvent,
  ApiKeyValidatedEvent,
  ApiKeyRejectedEvent,
  AuthorizationStartedEvent,
  AuthorizationPolicyEvaluatedEvent,
  AuthorizationPermittedEvent,
  AuthorizationDeniedEvent,
  CorsOriginEvaluatedEvent,
  CorsPreflightDeniedEvent,
  MtlsHandshakeStartedEvent,
  MtlsHandshakeCompletedEvent,
  MtlsHandshakeFailedEvent,
  SecurityResponseGeneratedEvent,
} from "./security-events";
import { SecurityRouteResolver } from "./gateway/route-resolver";
import { JwtSimulator } from "./authentication/jwt-simulator";
import { ApiKeySimulator } from "./authentication/api-key-simulator";
import { OAuthSimulator } from "./authentication/oauth-simulator";
import { PolicyEngine } from "./authorization/policy-engine";
import { WafEngine } from "./protection/waf-engine";
import { CorsSimulator } from "./protection/cors-simulator";
import { MtlsSimulator } from "./service-security/mtls-simulator";

export class SecurityExecutionEngine {
  /**
   * Deterministically executes a modeled security request scenario through gateway routing,
   * WAF, CORS, rate limiting, authentication, authorization, and service identity.
   */
  public static executeScenario(scenario: SecurityScenario): ExecutionTrace {
    const events: SecurityExecutionEvent[] = [];
    const frames: VisualizationFrame[] = [];
    let sequence = 1;
    let virtualClockMs = 0;

    const gatewayNodeId = scenario.entryNodeId || "api_gateway";
    const targetServiceNodeId = scenario.targetServiceNodeId || "order_service";
    const baseRuntimeState = RuntimeStateHelper.createInitialState();

    const metrics: SecurityMetrics = {
      totalRequests: 1,
      allowedRequests: 0,
      deniedRequests: 0,
      authenticationFailures: 0,
      authorizationDenials: 0,
      wafBlocks: 0,
      rateLimitRejections: 0,
      corsViolations: 0,
      mtlsFailures: 0,
      backendRequestsPrevented: 0,
      simulatedSecurityOverheadMs: 0,
    };

    const decisions: SecurityDecision[] = [];
    let selectedRoute: GatewaySecurityRoute | null = null;
    let principal: Principal | null = null;
    let reachedBackend = false;
    let terminated = false;
    let finalResponse: SecurityResponse = {
      statusCode: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
      body: { message: "Success" },
      generatedBy: "backend",
      explanation: "Request executed successfully through security pipeline.",
    };

    // ========================================================================
    // 1. Gateway Routing Resolution
    // ========================================================================
    const routeStartEvt: GatewayRouteEvaluationStartedEvent = {
      id: `evt_route_start_${sequence}`,
      sequence: sequence++,
      atMs: virtualClockMs,
      durationMs: 2,
      explanation: `Gateway '${gatewayNodeId}' evaluating routes for ${scenario.request.method} ${scenario.request.path}`,
      type: "gateway.route.evaluation.started",
      gatewayNodeId,
      path: scenario.request.path,
      method: scenario.request.method,
      candidateRoutesCount: scenario.routes.length,
    };
    events.push(routeStartEvt);
    virtualClockMs += 2;

    const routeResult = SecurityRouteResolver.matchRoute(
      scenario.routes,
      scenario.request.path,
      scenario.request.method
    );

    // Record candidate check diagnostics
    for (const rej of routeResult.rejectedReasons) {
      const candEvt: GatewayRouteCandidateCheckedEvent = {
        id: `evt_cand_${sequence}`,
        sequence: sequence++,
        atMs: virtualClockMs,
        durationMs: 1,
        explanation: `Candidate route '${rej.routeId}' rejected: ${rej.reason}`,
        type: "gateway.route.candidate.checked",
        gatewayNodeId,
        routeId: rej.routeId,
        pattern: scenario.routes.find((r) => r.id === rej.routeId)?.pathPattern || "",
        matched: false,
        rejectionReason: rej.reason,
      };
      events.push(candEvt);
      virtualClockMs += 1;
    }

    if (!routeResult.matched || !routeResult.route) {
      metrics.deniedRequests++;
      metrics.backendRequestsPrevented++;
      terminated = true;

      const notFoundEvt: GatewayRouteNotFoundEvent = {
        id: `evt_route_404_${sequence}`,
        sequence: sequence++,
        atMs: virtualClockMs,
        durationMs: 2,
        explanation: `No route matching path '${scenario.request.path}' was found in API Gateway route table (HTTP 404).`,
        type: "gateway.route.not_found",
        gatewayNodeId,
        path: scenario.request.path,
        method: scenario.request.method,
      };
      events.push(notFoundEvt);
      virtualClockMs += 2;

      finalResponse = {
        statusCode: 404,
        statusText: "Not Found",
        headers: { "content-type": "application/json" },
        body: { error: "Route not found", path: scenario.request.path },
        generatedBy: "gateway",
        explanation: "API Gateway has no route registered for the requested path.",
      };

      decisions.push({
        id: createDeterministicId("dec_route_404", `${scenario.id}:${scenario.request.path}`, decisions.length + 1),
        middlewareId: "gateway_router",
        middlewareType: "service_identity",
        outcome: "deny",
        reasonCode: "ROUTE_NOT_FOUND",
        explanation: "Path did not match any gateway route pattern.",
        atMs: virtualClockMs,
        httpStatusSuggested: 404,
      });
    } else {
      selectedRoute = routeResult.route;
      const routeSelEvt: GatewayRouteSelectedEvent = {
        id: `evt_route_sel_${sequence}`,
        sequence: sequence++,
        atMs: virtualClockMs,
        durationMs: 2,
        explanation: `Route matched: '${selectedRoute.pathPattern}' (${selectedRoute.matchType}) -> target node '${selectedRoute.targetNodeId}'`,
        type: "gateway.route.selected",
        gatewayNodeId,
        route: selectedRoute,
        targetNodeId: selectedRoute.targetNodeId,
        pathParams: routeResult.pathParams,
      };
      events.push(routeSelEvt);
      virtualClockMs += 2;
    }

    // ========================================================================
    // 2. Middleware Pipeline Execution in Configured Order
    // ========================================================================
    if (!terminated) {
      const activeStages = [...scenario.pipeline]
        .filter((s) => s.enabled)
        .sort((a, b) => a.order - b.order);

      for (const stage of activeStages) {
        if (terminated) break;

        switch (stage.type) {
          // --- WAF ---
          case "waf": {
            if (!scenario.wafPolicy) break;

            const wafStartEvt: WafEvaluationStartedEvent = {
              id: `evt_waf_start_${sequence}`,
              sequence: sequence++,
              atMs: virtualClockMs,
              durationMs: 2,
              explanation: `WAF evaluating ${scenario.wafPolicy.rules.length} inspection rules...`,
              type: "waf.evaluation.started",
              componentId: gatewayNodeId,
              rulesCount: scenario.wafPolicy.rules.length,
            };
            events.push(wafStartEvt);
            virtualClockMs += 2;

            const wafRes = WafEngine.evaluateRequest(scenario.wafPolicy, scenario.request);
            metrics.simulatedSecurityOverheadMs += 2;

            if (wafRes.action === "block") {
              metrics.wafBlocks++;
              metrics.deniedRequests++;
              metrics.backendRequestsPrevented++;
              terminated = true;

              const blockEvt: WafBlockedEvent = {
                id: `evt_waf_block_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 2,
                explanation: wafRes.explanation,
                type: "waf.blocked",
                componentId: gatewayNodeId,
                ruleId: wafRes.matchedRule?.id || "waf_block",
                reason: wafRes.explanation,
              };
              events.push(blockEvt);

              decisions.push({
                id: `dec_waf_${sequence}`,
                middlewareId: stage.id,
                middlewareType: "waf",
                outcome: "deny",
                reasonCode: "WAF_RULE_BLOCK",
                explanation: wafRes.explanation,
                atMs: virtualClockMs,
                httpStatusSuggested: 403,
              });

              finalResponse = {
                statusCode: 403,
                statusText: "Forbidden",
                headers: { "content-type": "application/json" },
                body: { error: "Blocked by Web Application Firewall", rule: wafRes.matchedRule?.name },
                generatedBy: "waf",
                explanation: wafRes.explanation,
              };
            } else {
              const allowEvt: WafAllowedEvent = {
                id: `evt_waf_allow_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: wafRes.explanation,
                type: "waf.allowed",
                componentId: gatewayNodeId,
                ruleId: wafRes.matchedRule?.id,
              };
              events.push(allowEvt);

              decisions.push({
                id: `dec_waf_${sequence}`,
                middlewareId: stage.id,
                middlewareType: "waf",
                outcome: "allow",
                reasonCode: "WAF_PASSED",
                explanation: "WAF rules passed.",
                atMs: virtualClockMs,
              });
            }
            virtualClockMs += 2;
            break;
          }

          // --- CORS ---
          case "cors": {
            if (!scenario.corsPolicy) break;

            const corsRes = CorsSimulator.evaluateCors(scenario.corsPolicy, scenario.request);
            metrics.simulatedSecurityOverheadMs += 1;

            const corsOriginEvt: CorsOriginEvaluatedEvent = {
              id: `evt_cors_eval_${sequence}`,
              sequence: sequence++,
              atMs: virtualClockMs,
              durationMs: 1,
              explanation: corsRes.explanation,
              type: "cors.origin.evaluated",
              origin: scenario.request.origin || "same-origin",
              isAllowed: corsRes.allowed,
            };
            events.push(corsOriginEvt);
            virtualClockMs += 1;

            if (!corsRes.allowed) {
              metrics.corsViolations++;
              metrics.deniedRequests++;
              metrics.backendRequestsPrevented++;
              terminated = true;

              const corsDenyEvt: CorsPreflightDeniedEvent = {
                id: `evt_cors_deny_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: corsRes.explanation,
                type: "cors.preflight.denied",
                origin: scenario.request.origin || "unknown",
                reason: corsRes.explanation,
              };
              events.push(corsDenyEvt);

              decisions.push({
                id: `dec_cors_${sequence}`,
                middlewareId: stage.id,
                middlewareType: "cors",
                outcome: "deny",
                reasonCode: "CORS_ORIGIN_DENIED",
                explanation: corsRes.explanation,
                atMs: virtualClockMs,
                httpStatusSuggested: 403,
              });

              finalResponse = {
                statusCode: 403,
                statusText: "Forbidden",
                headers: { "content-type": "application/json" },
                body: { error: "CORS origin restriction" },
                generatedBy: "cors",
                explanation: corsRes.explanation,
              };
            } else {
              decisions.push({
                id: `dec_cors_${sequence}`,
                middlewareId: stage.id,
                middlewareType: "cors",
                outcome: "allow",
                reasonCode: "CORS_ALLOWED",
                explanation: "Origin permitted by CORS allowlist.",
                atMs: virtualClockMs,
              });
            }
            break;
          }

          // --- Rate Limiting ---
          case "rate_limiting": {
            if (!scenario.rateLimitPolicy || !scenario.rateLimitPolicy.enabled) break;

            const rl = scenario.rateLimitPolicy;
            metrics.simulatedSecurityOverheadMs += 1;

            const rlEvalEvt: SecurityRateLimitEvaluatedEvent = {
              id: `evt_rl_eval_${sequence}`,
              sequence: sequence++,
              atMs: virtualClockMs,
              durationMs: 1,
              explanation: `Rate limiter checking quota for key '${scenario.request.clientIp}' (capacity: ${rl.capacity})...`,
              type: "security.ratelimit.evaluated",
              componentId: gatewayNodeId,
              identityKey: scenario.request.clientIp,
              remainingTokens: rl.capacity,
              capacity: rl.capacity,
            };
            events.push(rlEvalEvt);
            virtualClockMs += 1;

            // If capacity configured as 0 or negative -> Rate limit exceeded!
            if (rl.capacity <= 0) {
              metrics.rateLimitRejections++;
              metrics.deniedRequests++;
              metrics.backendRequestsPrevented++;
              terminated = true;

              const retryAfter = rl.retryAfterSec || 30;
              const rlRejEvt: SecurityRateLimitRejectedEvent = {
                id: `evt_rl_rej_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: `Rate limit quota exceeded! Request rejected with HTTP 429 Too Many Requests (Retry-After: ${retryAfter}s).`,
                type: "security.ratelimit.rejected",
                componentId: gatewayNodeId,
                identityKey: scenario.request.clientIp,
                retryAfterSec: retryAfter,
              };
              events.push(rlRejEvt);

              decisions.push({
                id: `dec_rl_${sequence}`,
                middlewareId: stage.id,
                middlewareType: "rate_limiting",
                outcome: "deny",
                reasonCode: "RATE_LIMIT_EXCEEDED",
                explanation: "Rate limit token bucket exhausted.",
                atMs: virtualClockMs,
                httpStatusSuggested: 429,
              });

              finalResponse = {
                statusCode: 429,
                statusText: "Too Many Requests",
                headers: {
                  "content-type": "application/json",
                  "retry-after": String(retryAfter),
                },
                body: { error: "Rate limit exceeded. Please retry later.", retryAfter },
                generatedBy: "rate_limiter",
                explanation: `Rate limit threshold exceeded for client ${scenario.request.clientIp}.`,
              };
            } else {
              const rlAllowEvt: SecurityRateLimitAllowedEvent = {
                id: `evt_rl_allow_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: `Rate limit quota available. Admitted request for client '${scenario.request.clientIp}'.`,
                type: "security.ratelimit.allowed",
                componentId: gatewayNodeId,
                identityKey: scenario.request.clientIp,
                consumed: 1,
              };
              events.push(rlAllowEvt);

              decisions.push({
                id: `dec_rl_${sequence}`,
                middlewareId: stage.id,
                middlewareType: "rate_limiting",
                outcome: "allow",
                reasonCode: "RATE_LIMIT_ALLOWED",
                explanation: "Rate limit tokens available.",
                atMs: virtualClockMs,
              });
            }
            break;
          }

          // --- Authentication ---
          case "authentication": {
            const authType = selectedRoute?.requiredAuth || "jwt";

            const authStartEvt: AuthStartedEvent = {
              id: `evt_auth_start_${sequence}`,
              sequence: sequence++,
              atMs: virtualClockMs,
              durationMs: 2,
              explanation: `Authentication middleware evaluating '${authType.toUpperCase()}' credentials...`,
              type: "auth.started",
              componentId: gatewayNodeId,
              authMethod: authType,
            };
            events.push(authStartEvt);
            virtualClockMs += 2;
            metrics.simulatedSecurityOverheadMs += 3;

            if (authType === "none") {
              principal = {
                id: "usr_anonymous",
                isAuthenticated: false,
                authMethod: "anonymous",
                roles: ["anonymous"],
                permissions: ["read:public"],
                attributes: {},
              };
              break;
            }

            if (authType === "jwt") {
              const jwtScenario = scenario.jwtScenario || {
                tokenPresent: false,
                structureValid: false,
                signatureValid: false,
                algorithmAllowed: true,
                expectedIssuer: "https://auth.nxtqr.com",
                actualIssuer: "none",
                expectedAudience: "https://api.nxtqr.com",
                actualAudience: "none",
                claims: {},
              };

              const jwtStartEvt: JwtEvaluationStartedEvent = {
                id: `evt_jwt_start_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: "Beginning 10-step virtual time JWT claim and cryptographic signature verification...",
                type: "jwt.evaluation.started",
                componentId: gatewayNodeId,
                tokenPreview: jwtScenario.rawTokenPreview || "eyJhbGciOiJSUzI1NiIsIn...",
              };
              events.push(jwtStartEvt);
              virtualClockMs += 1;

              const jwtRes = JwtSimulator.validateToken(jwtScenario, virtualClockMs);

              // Record step events
              for (const step of jwtRes.steps) {
                if (step.passed) {
                  const stepEvt: JwtStepValidatedEvent = {
                    id: `evt_jwt_step_${sequence}`,
                    sequence: sequence++,
                    atMs: virtualClockMs,
                    durationMs: 1,
                    explanation: `JWT Step ${step.stepNumber} [${step.stepName}]: ${step.explanation}`,
                    type: "jwt.step.validated",
                    componentId: gatewayNodeId,
                    stepName: step.stepName,
                    detail: step.explanation,
                  };
                  events.push(stepEvt);
                } else {
                  const failStepEvt: JwtStepFailedEvent = {
                    id: `evt_jwt_fail_${sequence}`,
                    sequence: sequence++,
                    atMs: virtualClockMs,
                    durationMs: 1,
                    explanation: `JWT Step ${step.stepNumber} [${step.stepName}] FAILED: ${step.explanation}`,
                    type: "jwt.step.failed",
                    componentId: gatewayNodeId,
                    stepName: step.stepName,
                    failureReason: step.explanation,
                  };
                  events.push(failStepEvt);
                }
                virtualClockMs += 1;
              }

              if (!jwtRes.valid) {
                metrics.authenticationFailures++;
                metrics.deniedRequests++;
                metrics.backendRequestsPrevented++;
                terminated = true;

                const authFailEvt: AuthFailedEvent = {
                  id: `evt_auth_fail_${sequence}`,
                  sequence: sequence++,
                  atMs: virtualClockMs,
                  durationMs: 2,
                  explanation: `Authentication rejected (HTTP 401 Unauthorized): ${jwtRes.failureExplanation}`,
                  type: "auth.failed",
                  componentId: gatewayNodeId,
                  reasonCode: jwtRes.failureReasonCode || "AUTH_FAILED",
                  httpStatus: 401,
                };
                events.push(authFailEvt);

                decisions.push({
                  id: `dec_auth_${sequence}`,
                  middlewareId: stage.id,
                  middlewareType: "authentication",
                  outcome: "deny",
                  reasonCode: jwtRes.failureReasonCode || "JWT_INVALID",
                  explanation: jwtRes.failureExplanation || "JWT validation failed.",
                  atMs: virtualClockMs,
                  httpStatusSuggested: 401,
                });

                finalResponse = {
                  statusCode: 401,
                  statusText: "Unauthorized",
                  headers: {
                    "content-type": "application/json",
                    "www-authenticate": `Bearer error="${jwtRes.failureReasonCode || "invalid_token"}"`,
                  },
                  body: { error: "Unauthorized", message: jwtRes.failureExplanation },
                  generatedBy: "auth",
                  explanation: jwtRes.failureExplanation || "Authentication required.",
                };
              } else {
                principal = jwtRes.principal!;
                const authSuccEvt: AuthSucceededEvent = {
                  id: `evt_auth_succ_${sequence}`,
                  sequence: sequence++,
                  atMs: virtualClockMs,
                  durationMs: 1,
                  explanation: `Authentication successful! Authenticated as principal '${principal.id}' (Roles: [${principal.roles.join(", ")}]).`,
                  type: "auth.succeeded",
                  componentId: gatewayNodeId,
                  principal,
                };
                events.push(authSuccEvt);

                decisions.push({
                  id: `dec_auth_${sequence}`,
                  middlewareId: stage.id,
                  middlewareType: "authentication",
                  outcome: "allow",
                  reasonCode: "AUTH_SUCCEEDED",
                  explanation: `Authenticated via JWT as ${principal.id}`,
                  atMs: virtualClockMs,
                });
              }
            } else if (authType === "apikey") {
              const keyScenario = scenario.apiKeyScenario || {
                keyPresent: false,
                keyHeaderName: "x-api-key",
                isValid: false,
                isRevoked: false,
              };

              const keyStartEvt: ApiKeyLookupStartedEvent = {
                id: `evt_key_start_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: `Looking up API key in header '${keyScenario.keyHeaderName}'...`,
                type: "apikey.lookup.started",
                componentId: gatewayNodeId,
                headerName: keyScenario.keyHeaderName,
              };
              events.push(keyStartEvt);
              virtualClockMs += 1;

              const keyRes = ApiKeySimulator.validateKey(keyScenario, virtualClockMs);

              if (!keyRes.valid) {
                metrics.authenticationFailures++;
                metrics.deniedRequests++;
                metrics.backendRequestsPrevented++;
                terminated = true;

                const keyRejEvt: ApiKeyRejectedEvent = {
                  id: `evt_key_rej_${sequence}`,
                  sequence: sequence++,
                  atMs: virtualClockMs,
                  durationMs: 1,
                  explanation: keyRes.explanation,
                  type: "apikey.rejected",
                  componentId: gatewayNodeId,
                  reason: keyRes.explanation,
                };
                events.push(keyRejEvt);

                decisions.push({
                  id: `dec_key_${sequence}`,
                  middlewareId: stage.id,
                  middlewareType: "authentication",
                  outcome: "deny",
                  reasonCode: keyRes.failureReasonCode || "API_KEY_INVALID",
                  explanation: keyRes.explanation,
                  atMs: virtualClockMs,
                  httpStatusSuggested: 401,
                });

                finalResponse = {
                  statusCode: 401,
                  statusText: "Unauthorized",
                  headers: { "content-type": "application/json" },
                  body: { error: "Invalid API Key", message: keyRes.explanation },
                  generatedBy: "auth",
                  explanation: keyRes.explanation,
                };
              } else {
                principal = keyRes.principal!;
                const keyValEvt: ApiKeyValidatedEvent = {
                  id: `evt_key_val_${sequence}`,
                  sequence: sequence++,
                  atMs: virtualClockMs,
                  durationMs: 1,
                  explanation: keyRes.explanation,
                  type: "apikey.validated",
                  componentId: gatewayNodeId,
                  keyPrefix: keyScenario.keyValuePreview?.slice(0, 7) || "nxt_live",
                };
                events.push(keyValEvt);

                decisions.push({
                  id: `dec_key_${sequence}`,
                  middlewareId: stage.id,
                  middlewareType: "authentication",
                  outcome: "allow",
                  reasonCode: "API_KEY_VALID",
                  explanation: "API key verified.",
                  atMs: virtualClockMs,
                });
              }
            } else if (authType === "oauth" && scenario.oauthScenario) {
              const oauthRes = OAuthSimulator.simulateFlow(scenario.oauthScenario, virtualClockMs);
              if (!oauthRes.success) {
                metrics.authenticationFailures++;
                metrics.deniedRequests++;
                metrics.backendRequestsPrevented++;
                terminated = true;

                decisions.push({
                  id: `dec_oauth_${sequence}`,
                  middlewareId: stage.id,
                  middlewareType: "authentication",
                  outcome: "deny",
                  reasonCode: oauthRes.failureReason || "OAUTH_FAILED",
                  explanation: "OAuth authorization grant failed.",
                  atMs: virtualClockMs,
                  httpStatusSuggested: 401,
                });

                finalResponse = {
                  statusCode: 401,
                  statusText: "Unauthorized",
                  headers: { "content-type": "application/json" },
                  body: { error: "OAuth authorization denied" },
                  generatedBy: "auth",
                  explanation: "OAuth authorization failed.",
                };
              } else {
                principal = oauthRes.principal!;
                decisions.push({
                  id: `dec_oauth_${sequence}`,
                  middlewareId: stage.id,
                  middlewareType: "authentication",
                  outcome: "allow",
                  reasonCode: "OAUTH_SUCCEEDED",
                  explanation: "OAuth token verified.",
                  atMs: virtualClockMs,
                });
              }
            }
            break;
          }

          // --- Authorization ---
          case "authorization": {
            if (!scenario.authzPolicy) break;

            if (selectedRoute?.requiredAuth === "none") {
              // Public route does not enforce authorization
              decisions.push({
                id: `dec_authz_${sequence}`,
                middlewareId: stage.id,
                middlewareType: "authorization",
                outcome: "allow",
                reasonCode: "PUBLIC_ROUTE_PERMITTED",
                explanation: "Public route does not require authorization.",
                atMs: virtualClockMs,
              });
              break;
            }

            const resContext = scenario.request.resourceContext || {
              resourceId: "res_orders_42",
              resourceType: "orders",
              action: scenario.request.method === "DELETE" ? "delete" : scenario.request.method === "POST" ? "write" : "read",
            };

            const authzStartEvt: AuthorizationStartedEvent = {
              id: `evt_authz_start_${sequence}`,
              sequence: sequence++,
              atMs: virtualClockMs,
              durationMs: 2,
              explanation: `Authorization engine evaluating policies for principal '${principal?.id || "anonymous"}' on resource '${resContext.resourceId}' (Action: '${resContext.action}')...`,
              type: "authorization.started",
              componentId: gatewayNodeId,
              principalId: principal?.id || "anonymous",
              resourceId: resContext.resourceId,
              action: resContext.action,
            };
            events.push(authzStartEvt);
            virtualClockMs += 2;
            metrics.simulatedSecurityOverheadMs += 2;

            const authzResult = PolicyEngine.evaluateAuthorization(
              scenario.authzPolicy,
              principal,
              resContext
            );

            // Emit policy evaluation events
            for (const ev of authzResult.evaluations) {
              const polEvt: AuthorizationPolicyEvaluatedEvent = {
                id: `evt_pol_eval_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: ev.explanation,
                type: "authorization.policy.evaluated",
                componentId: gatewayNodeId,
                ruleId: ev.ruleId,
                policyType: ev.type,
                outcome: ev.outcome,
                rationale: ev.explanation,
              };
              events.push(polEvt);
              virtualClockMs += 1;
            }

            if (authzResult.decision === "deny") {
              metrics.authorizationDenials++;
              metrics.deniedRequests++;
              metrics.backendRequestsPrevented++;
              terminated = true;

              const denyEvt: AuthorizationDeniedEvent = {
                id: `evt_authz_deny_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 2,
                explanation: `Authorization DENIED (HTTP 403 Forbidden): ${authzResult.explanation}`,
                type: "authorization.denied",
                componentId: gatewayNodeId,
                principalId: principal?.id || "anonymous",
                denialCode: authzResult.denialReasonCode || "FORBIDDEN",
                reason: authzResult.explanation,
              };
              events.push(denyEvt);

              decisions.push({
                id: `dec_authz_${sequence}`,
                middlewareId: stage.id,
                middlewareType: "authorization",
                outcome: "deny",
                reasonCode: authzResult.denialReasonCode || "AUTHZ_DENIED",
                explanation: authzResult.explanation,
                atMs: virtualClockMs,
                httpStatusSuggested: 403,
              });

              finalResponse = {
                statusCode: 403,
                statusText: "Forbidden",
                headers: { "content-type": "application/json" },
                body: { error: "Forbidden", reason: authzResult.explanation },
                generatedBy: "authorization",
                explanation: authzResult.explanation,
              };
            } else {
              const permEvt: AuthorizationPermittedEvent = {
                id: `evt_authz_perm_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: authzResult.explanation,
                type: "authorization.permitted",
                componentId: gatewayNodeId,
                principalId: principal?.id || "anonymous",
                grantedByRuleId: authzResult.matchedRuleId,
              };
              events.push(permEvt);

              decisions.push({
                id: `dec_authz_${sequence}`,
                middlewareId: stage.id,
                middlewareType: "authorization",
                outcome: "allow",
                reasonCode: "AUTHZ_PERMITTED",
                explanation: authzResult.explanation,
                atMs: virtualClockMs,
              });
            }
            break;
          }

          // --- mTLS & Service Identity ---
          case "mtls": {
            if (!scenario.mtlsPolicy || !scenario.mtlsPolicy.enabled) break;

            const mtlsStartEvt: MtlsHandshakeStartedEvent = {
              id: `evt_mtls_start_${sequence}`,
              sequence: sequence++,
              atMs: virtualClockMs,
              durationMs: 3,
              explanation: "Mutual TLS handshake initiated between caller and service endpoint...",
              type: "mtls.handshake.started",
              serverNodeId: gatewayNodeId,
            };
            events.push(mtlsStartEvt);
            virtualClockMs += 3;
            metrics.simulatedSecurityOverheadMs += 4;

            const mtlsRes = MtlsSimulator.evaluateHandshake(scenario.mtlsPolicy, virtualClockMs);

            if (!mtlsRes.handshakeSuccess) {
              metrics.mtlsFailures++;
              metrics.deniedRequests++;
              metrics.backendRequestsPrevented++;
              terminated = true;

              const mtlsFailEvt: MtlsHandshakeFailedEvent = {
                id: `evt_mtls_fail_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 2,
                explanation: mtlsRes.explanation,
                type: "mtls.handshake.failed",
                reason: mtlsRes.explanation,
              };
              events.push(mtlsFailEvt);

              decisions.push({
                id: `dec_mtls_${sequence}`,
                middlewareId: stage.id,
                middlewareType: "mtls",
                outcome: "deny",
                reasonCode: "MTLS_HANDSHAKE_FAILED",
                explanation: mtlsRes.explanation,
                atMs: virtualClockMs,
                httpStatusSuggested: 400,
              });

              finalResponse = {
                statusCode: 400,
                statusText: "Bad Request",
                headers: { "content-type": "application/json" },
                body: { error: "SSL/TLS client certificate validation error", detail: mtlsRes.explanation },
                generatedBy: "mtls",
                explanation: mtlsRes.explanation,
              };
            } else {
              const mtlsCompEvt: MtlsHandshakeCompletedEvent = {
                id: `evt_mtls_comp_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: mtlsRes.explanation,
                type: "mtls.handshake.completed",
                tlsVersion: "TLS 1.3",
                cipherSuite: "TLS_AES_256_GCM_SHA384",
              };
              events.push(mtlsCompEvt);

              decisions.push({
                id: `dec_mtls_${sequence}`,
                middlewareId: stage.id,
                middlewareType: "mtls",
                outcome: "allow",
                reasonCode: "MTLS_ESTABLISHED",
                explanation: "Mutual TLS client certificate verified.",
                atMs: virtualClockMs,
              });
            }
            break;
          }

          default:
            break;
        }
      }
    }

    // ========================================================================
    // 3. Backend Service Execution (Only If All Passed)
    // ========================================================================
    if (!terminated) {
      reachedBackend = true;
      metrics.allowedRequests++;
      virtualClockMs += 10; // Backend service execution latency

      finalResponse = {
        statusCode: scenario.request.method === "POST" ? 201 : 200,
        statusText: scenario.request.method === "POST" ? "Created" : "OK",
        headers: { "content-type": "application/json" },
        body: {
          success: true,
          data: {
            orderId: 42,
            item: "Quantum Processor",
            status: "active",
            authorizedPrincipal: principal?.id,
          },
        },
        generatedBy: "backend",
        explanation: `Protected backend service '${targetServiceNodeId}' processed request and generated 200 OK.`,
      };
    }

    // Response Generated Event
    const respEvt: SecurityResponseGeneratedEvent = {
      id: `evt_resp_gen_${sequence}`,
      sequence: sequence++,
      atMs: virtualClockMs,
      durationMs: 1,
      explanation: `Security response generated: HTTP ${finalResponse.statusCode} ${finalResponse.statusText} by '${finalResponse.generatedBy}'`,
      type: "security.response.generated",
      statusCode: finalResponse.statusCode,
      statusText: finalResponse.statusText,
      generatedBy: finalResponse.generatedBy,
      reachedBackend,
      securityDecision: decisions[decisions.length - 1] || {
        id: "dec_none",
        middlewareId: "none",
        middlewareType: "service_identity",
        outcome: reachedBackend ? "allow" : "deny",
        reasonCode: reachedBackend ? "ALL_CHECKS_PASSED" : "BLOCKED",
        explanation: finalResponse.explanation,
        atMs: virtualClockMs,
      },
    };
    events.push(respEvt);

    // ========================================================================
    // 4. Assemble Modeled Security Runtime State & Visualization Frames
    // ========================================================================
    const finalDecision: "allow" | "deny" | "challenge" = reachedBackend ? "allow" : "deny";

    const securityState: ModeledSecurityRuntimeState = {
      activeRequest: scenario.request,
      selectedRoute,
      principal,
      pipelineDecisions: decisions,
      finalDecision,
      finalResponse,
      reachedBackend,
      metrics,
    };

    const finalRuntimeState: ModeledRuntimeState = {
      ...baseRuntimeState,
      securityState,
    };

    for (let i = 0; i < events.length; i++) {
      const evt = events[i];
      frames.push({
        frameIndex: i,
        virtualTimeMs: evt.atMs,
        activeNodeIds: reachedBackend && i === events.length - 1 ? [targetServiceNodeId] : [gatewayNodeId],
        activeEdgeIds: [],
        activeEvent: evt,
        direction: reachedBackend ? "response" : "request",
        stepTitle: evt.type.replace(/\./g, " ").toUpperCase(),
        stepExplanation: evt.explanation,
        runtimeState: finalRuntimeState,
        metrics: {
          securityMetrics: {
            ...metrics,
            allowed: metrics.allowedRequests,
            denied: metrics.deniedRequests,
            authFailures: metrics.authenticationFailures,
            authzDenials: metrics.authorizationDenials,
            wafBlocks: metrics.wafBlocks,
            rateLimits: metrics.rateLimitRejections,
            backendPrevented: metrics.backendRequestsPrevented,
          },
        },
      });
    }

    return {
      runId: createDeterministicId("run_sec", `${scenario.id}:${gatewayNodeId}`),
      architectureId: "arch_sec_sim",
      architectureRevisionId: "rev_001",
      snapshotHash: "hash_sec_001",
      createdAt: DETERMINISTIC_EPOCH_ISO,
      visitedNodeIds: reachedBackend ? [gatewayNodeId, targetServiceNodeId] : [gatewayNodeId],
      traversedEdgeIds: [],
      configuration: {
        version: 1,
        entryNodeId: gatewayNodeId,
        request: {
          id: scenario.request.id,
          method: scenario.request.method as any,
          path: scenario.request.path,
          headers: scenario.request.headers,
        },
        routing: { mode: "deterministic", selectedBranches: {} },
        limits: { maxHops: 50, maxEvents: 5000, maxDurationMs: 30000 },
        timing: { nodeDurationMs: 10, edgeDurationMs: 5 },
      },
      events,
      totalDurationMs: virtualClockMs,
      totalEvents: events.length,
      totalHops: reachedBackend ? 2 : 1,
      outcome: reachedBackend ? "success" : "failure",
      terminalReason: finalResponse.explanation,
      frames,
    };
  }
}
