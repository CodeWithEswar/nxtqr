"use client";

import * as React from "react";
import {
  ShieldIcon,
  CloseIcon,
  PlayIcon,
  CheckIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "@nxtqr/icons";
import {
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";
import {
  SECURITY_PRESET_METADATA,
  type SecurityScenarioPresetId,
  createSecurityPresetScenario,
  type SecurityDecision,
  type MiddlewareStageConfig,
  type WafRule,
} from "@nxtqr/architecture-execution";

export interface SecurityExecutionWorkspaceProps {
  onClose?: () => void;
}

type TabType =
  | "pipeline"
  | "authentication"
  | "authorization"
  | "waf_rate_limit"
  | "mtls"
  | "oauth";

export function SecurityExecutionWorkspace({ onClose }: SecurityExecutionWorkspaceProps) {
  const isSecurityWorkspaceOpen = useExecutionStore((s) => s.isSecurityWorkspaceOpen);
  const toggleSecurityWorkspace = useExecutionStore((s) => s.toggleSecurityWorkspace);
  const activeSecurityScenario = useExecutionStore((s) => s.activeSecurityScenario);
  const playbackState = useExecutionStore((s) => s.playbackState);
  const runSecuritySimulation = useExecutionStore((s) => s.runSecuritySimulation);

  const [activeTab, setActiveTab] = React.useState<TabType>("pipeline");

  if (!isSecurityWorkspaceOpen) {
    return null;
  }

  const currentFrame = playbackState.currentFrame;
  const securityState = currentFrame?.runtimeState?.securityState;
  const metrics = securityState?.metrics;
  const decisions: SecurityDecision[] = securityState?.pipelineDecisions || [];
  const activePrincipal = securityState?.principal;
  const selectedRoute = securityState?.selectedRoute;
  const finalResponse = securityState?.finalResponse;
  const finalDecision = securityState?.finalDecision;

  const handleSelectPreset = (presetId: SecurityScenarioPresetId) => {
    const sc = createSecurityPresetScenario(presetId);
    runSecuritySimulation(sc);
  };

  const handleRunSimulation = () => {
    const sc = activeSecurityScenario || createSecurityPresetScenario("protected_valid_jwt");
    runSecuritySimulation(sc);
  };

  const handleClose = () => {
    if (onClose) onClose();
    else toggleSecurityWorkspace(false);
  };

  const isPermitted = finalDecision
    ? finalDecision === "allow"
    : activeSecurityScenario
      ? !activeSecurityScenario.id.includes("deni") &&
        !activeSecurityScenario.id.includes("block") &&
        !activeSecurityScenario.id.includes("expired") &&
        !activeSecurityScenario.id.includes("invalid") &&
        !activeSecurityScenario.id.includes("rejection")
      : true;

  const currentStatusCode = finalResponse?.statusCode || (isPermitted ? 200 : 403);
  const pipelineStages: MiddlewareStageConfig[] =
    activeSecurityScenario?.pipeline || [
      { id: "m1", name: "WAF Inspection", type: "waf", enabled: true, order: 1 },
      { id: "m2", name: "CORS Evaluation", type: "cors", enabled: true, order: 2 },
      { id: "m3", name: "Rate Limiting", type: "rate_limiting", enabled: true, order: 3 },
      { id: "m4", name: "Authentication Middleware", type: "authentication", enabled: true, order: 4 },
      { id: "m5", name: "Authorization & RBAC/ABAC", type: "authorization", enabled: true, order: 5 },
      { id: "m6", name: "Service Security & mTLS", type: "mtls", enabled: true, order: 6 },
    ];

  return (
    <div
      role="region"
      aria-label="Security Execution Workspace"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface-01 border-t border-border-default shadow-level-3 flex flex-col max-h-[520px] h-[520px] select-none transition-transform"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-02 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-surface-03 border border-border-default text-text-secondary">
            <ShieldIcon className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold tracking-wider uppercase text-foreground">
                API Gateway, Auth & Security Engine
              </span>
              <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 bg-surface-03 border-border-default text-text-secondary">
                Phase 05.4.8
              </Badge>
              {activeSecurityScenario && (
                <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 bg-surface-03 border-border-subtle text-text-muted">
                  {activeSecurityScenario.id.replace(/_/g, " ").toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="text-[11px] text-text-muted font-mono truncate max-w-xl">
              {activeSecurityScenario?.description || "Deterministic virtual-time security evaluation: WAF, CORS, Rate Limit, Auth, RBAC/ABAC, and mTLS."}
            </div>
          </div>
        </div>

        {/* Preset Selector & Simulation Controls */}
        <div className="flex items-center gap-2">
          <div className="w-72">
            <Select
              value={activeSecurityScenario?.id || "protected_valid_jwt"}
              onValueChange={(val) => handleSelectPreset(val as SecurityScenarioPresetId)}
            >
              <SelectTrigger className="h-7 text-[11px] font-mono bg-surface-02 border-border-default text-foreground">
                <SelectValue placeholder="Select security scenario..." />
              </SelectTrigger>
              <SelectContent className="bg-surface-02 border-border-default text-foreground max-h-72">
                {Object.values(SECURITY_PRESET_METADATA).map((meta) => (
                  <SelectItem
                    key={meta.id}
                    value={meta.id}
                    className="text-xs font-mono text-text-secondary focus:bg-surface-03 focus:text-foreground cursor-pointer"
                  >
                    <span className="font-medium text-foreground">{meta.title}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            onClick={handleRunSimulation}
            className="h-7 px-2.5 text-xs font-mono bg-foreground text-background hover:bg-neutral-200 rounded-md gap-1 font-medium"
          >
            <PlayIcon className="w-3 h-3" />
            <span>Simulate</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-7 w-7 p-0 text-text-muted hover:text-foreground hover:bg-surface-03 rounded-md"
            title="Close workspace"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-surface-03 border-b border-border-subtle text-xs font-mono shrink-0">
        <div className="flex items-center gap-5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Total:</span>
            <span className="text-foreground font-semibold">
              {metrics?.totalRequests ?? (activeSecurityScenario ? 1 : 0)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Allowed:</span>
            <span className={cn("font-semibold", (metrics?.allowedRequests ?? (isPermitted ? 1 : 0)) > 0 ? "text-foreground" : "text-text-muted")}>
              {metrics?.allowedRequests ?? (isPermitted ? 1 : 0)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Denied:</span>
            <span className={cn("font-semibold", (metrics?.deniedRequests ?? (!isPermitted ? 1 : 0)) > 0 ? "text-text-secondary" : "text-text-muted")}>
              {metrics?.deniedRequests ?? (!isPermitted ? 1 : 0)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Auth Fails:</span>
            <span className={cn("font-semibold", (metrics?.authenticationFailures || 0) > 0 ? "text-text-secondary" : "text-text-muted")}>
              {metrics?.authenticationFailures ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Authz Denials:</span>
            <span className={cn("font-semibold", (metrics?.authorizationDenials || 0) > 0 ? "text-text-secondary" : "text-text-muted")}>
              {metrics?.authorizationDenials ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">WAF Blocks:</span>
            <span className={cn("font-semibold", (metrics?.wafBlocks || 0) > 0 ? "text-text-secondary" : "text-text-muted")}>
              {metrics?.wafBlocks ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Rate Limited:</span>
            <span className={cn("font-semibold", (metrics?.rateLimitRejections || 0) > 0 ? "text-text-secondary" : "text-text-muted")}>
              {metrics?.rateLimitRejections ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Backend Spared:</span>
            <span className="text-foreground font-semibold">
              {metrics?.backendRequestsPrevented ?? (!isPermitted ? 1 : 0)}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-surface-02 p-0.5 rounded-md border border-border-subtle">
          {(
            [
              { id: "pipeline", label: "Pipeline & Routing" },
              { id: "authentication", label: "Authentication & JWT" },
              { id: "authorization", label: "Authorization & Policies" },
              { id: "waf_rate_limit", label: "WAF & Rate Limiting" },
              { id: "mtls", label: "Service Mesh & mTLS" },
              { id: "oauth", label: "OAuth 2.0 Sequence" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors",
                activeTab === tab.id
                  ? "bg-surface-04 text-foreground font-semibold shadow-level-3 border border-border-strong"
                  : "text-text-muted hover:text-foreground hover:bg-surface-03"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents Area */}
      <div className="flex-1 overflow-auto p-4 bg-surface-01">
        {/* Tab 1: Pipeline & Routing */}
        {activeTab === "pipeline" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Left: Request & Route Resolver (5 cols) */}
            <div className="col-span-5 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  API Gateway Route Resolution
                </span>
                <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-border-default text-text-muted">
                  {activeSecurityScenario?.routes.length || 0} Routes Configured
                </Badge>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-auto font-mono text-xs">
                {/* Active Incoming Request Card */}
                <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-text-muted tracking-wider">Modeled Request</span>
                    <Badge variant="outline" className="text-[10px] py-0 h-4 bg-surface-03 border-border-subtle text-foreground font-bold">
                      {activeSecurityScenario?.request.method || "GET"}
                    </Badge>
                  </div>
                  <div className="text-foreground font-semibold text-xs truncate">
                    {activeSecurityScenario?.request.path || "/api/orders"}
                  </div>
                  <div className="text-[10px] text-text-secondary flex items-center justify-between pt-1 border-t border-border-subtle">
                    <span>IP: {activeSecurityScenario?.request.clientIp || "127.0.0.1"}</span>
                    <span>Origin: {activeSecurityScenario?.request.origin || "internal"}</span>
                  </div>
                </div>

                {/* Candidate Route Table */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium text-text-secondary">Gateway Route Table</div>
                  <div className="space-y-1">
                    {(activeSecurityScenario?.routes || []).map((route) => {
                      const isMatched = selectedRoute?.id === route.id || route.id === activeSecurityScenario?.routes[0]?.id;
                      return (
                        <div
                          key={route.id}
                          className={cn(
                            "p-2 rounded-md border text-[11px] transition-colors flex items-center justify-between",
                            isMatched
                              ? "bg-surface-04 border-border-strong text-foreground shadow-level-1"
                              : "bg-surface-01 border-border-subtle text-text-secondary"
                          )}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground">{route.pathPattern}</span>
                              <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-border-subtle text-text-muted">
                                {route.requiredAuth}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-text-muted">
                              Target: {route.targetNodeId} | Priority: {route.priority}
                            </div>
                          </div>
                          {isMatched ? (
                            <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-border-strong bg-surface-03 text-foreground font-semibold">
                              MATCHED
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-text-disabled">STANDBY</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Ordered Middleware Pipeline Flow (7 cols) */}
            <div className="col-span-7 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  Middleware Chain Execution Order
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  Overhead: ~{pipelineStages.length * 2}ms
                </span>
              </div>

              <div className="p-3 space-y-2 flex-1 overflow-auto font-mono text-xs">
                {pipelineStages.map((stage: MiddlewareStageConfig, idx: number) => {
                  const stageDecision = decisions.find((d) => d.middlewareType === stage.type || d.middlewareId === stage.id);
                  const isBlocked = stageDecision ? stageDecision.outcome === "deny" : false;
                  const isPassed = stageDecision ? stageDecision.outcome === "allow" : isPermitted;

                  return (
                    <div
                      key={stage.id}
                      className={cn(
                        "p-2.5 rounded-md border transition-all flex items-start justify-between gap-3",
                        isBlocked
                          ? "bg-surface-04 border-border-strong text-foreground shadow-level-2"
                          : isPassed
                            ? "bg-surface-01 border-border-default text-text-secondary"
                            : "bg-surface-01 border-border-subtle text-text-muted opacity-60"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-md bg-surface-03 border border-border-default flex items-center justify-center text-[10px] font-bold text-foreground shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{stage.name}</span>
                            <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-border-subtle text-text-muted">
                              {stage.type}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-text-muted mt-0.5">
                            {stageDecision?.explanation || (isPassed ? "Evaluated successfully in pipeline." : "Awaiting execution.")}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isBlocked ? (
                          <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 bg-surface-03 border-border-strong text-text-secondary font-semibold">
                            TERMINATED
                          </Badge>
                        ) : isPassed ? (
                          <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 bg-surface-03 border-border-default text-foreground font-semibold">
                            PASSED
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-border-subtle text-text-disabled">
                            PENDING
                          </Badge>
                        )}
                        <span className="text-[9px] text-text-muted">+2ms</span>
                      </div>
                    </div>
                  );
                })}

                {/* Final Gateway Decision Box */}
                <div className="mt-3 p-2.5 rounded-md bg-surface-03 border border-border-strong flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isPermitted ? (
                      <CheckCircleIcon className="w-4 h-4 text-foreground" />
                    ) : (
                      <AlertTriangleIcon className="w-4 h-4 text-text-secondary" />
                    )}
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        {isPermitted ? "Request Allowed to Upstream Backend" : "Request Blocked at Gateway Edge"}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        HTTP Status: {currentStatusCode} — {isPermitted ? "All security policies satisfied." : "Terminated early by security boundary."}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono py-0.5 border-border-strong bg-surface-04 text-foreground font-bold">
                    {currentStatusCode}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Authentication & JWT */}
        {activeTab === "authentication" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Left: 10-Step Virtual Time JWT Checklist (7 cols) */}
            <div className="col-span-7 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  10-Step Virtual Time JWT Verification Checklist
                </span>
                <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-border-default text-text-muted">
                  {isPermitted ? "TOKEN VALID" : "VALIDATION FAILED"}
                </Badge>
              </div>

              <div className="p-3 space-y-1.5 flex-1 overflow-auto font-mono text-xs">
                {[
                  { step: 1, name: "Format Decoding", description: "3 base64url segments present (header.payload.signature)", passed: true },
                  { step: 2, name: "Algorithm Allowlist", description: "Algorithm 'RS256' permitted by gateway policy", passed: true },
                  { step: 3, name: "Signature Verification", description: "Cryptographic signature verified against IdP JWKS public key", passed: !activeSecurityScenario?.id.includes("signature") },
                  { step: 4, name: "Expiration (exp)", description: "exp: 1715000100 > virtual clock: 1715000000 (valid)", passed: !activeSecurityScenario?.id.includes("expired") },
                  { step: 5, name: "Not Before (nbf)", description: "nbf: 1714999900 <= virtual clock: 1715000000", passed: true },
                  { step: 6, name: "Issuer (iss)", description: "iss == 'https://auth.nxtqr.internal'", passed: true },
                  { step: 7, name: "Audience (aud)", description: "aud matches target resource identifier", passed: !activeSecurityScenario?.id.includes("audience") },
                  { step: 8, name: "Token ID (jti)", description: "jti is fresh and not found in replay cache", passed: true },
                  { step: 9, name: "Subject (sub)", description: "sub: 'usr_001' maps to valid active directory principal", passed: true },
                  { step: 10, name: "Claims Extraction", description: "Roles, tenantId, and custom scopes extracted successfully", passed: true },
                ].map((stepItem) => (
                  <div
                    key={stepItem.step}
                    className={cn(
                      "p-2 rounded-md border flex items-center justify-between gap-2 text-[11px]",
                      stepItem.passed
                        ? "bg-surface-01 border-border-subtle text-text-secondary"
                        : "bg-surface-04 border-border-strong text-foreground shadow-level-1 font-semibold"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px]",
                        stepItem.passed ? "bg-surface-03 text-foreground" : "bg-surface-04 text-text-secondary border border-border-strong"
                      )}>
                        {stepItem.passed ? <CheckIcon className="w-2.5 h-2.5" /> : <CloseIcon className="w-2.5 h-2.5" />}
                      </div>
                      <span className="font-medium text-foreground">{stepItem.name}</span>
                      <span className="text-[10px] text-text-muted truncate max-w-sm">{stepItem.description}</span>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[9px] py-0 h-3.5 font-mono",
                      stepItem.passed ? "border-border-subtle text-text-muted" : "border-border-strong bg-surface-03 text-foreground font-bold"
                    )}>
                      {stepItem.passed ? "PASS" : "FAIL"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Principal Claims & API Key Inspector (5 cols) */}
            <div className="col-span-5 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  Principal Identity & Claims
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  Method: {activePrincipal?.authMethod || "jwt"}
                </span>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-auto font-mono text-xs">
                {/* Principal Attributes */}
                <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-[10px] uppercase">Subject ID</span>
                    <span className="text-foreground font-semibold">{activePrincipal?.id || "usr_anonymous"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-[10px] uppercase">Tenant ID</span>
                    <span className="text-text-secondary">{activePrincipal?.tenantId || "tenant_default"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-[10px] uppercase">Roles</span>
                    <div className="flex gap-1">
                      {(activePrincipal?.roles || ["viewer"]).map((r: string) => (
                        <Badge key={r} variant="outline" className="text-[9px] py-0 h-3.5 bg-surface-03 border-border-subtle text-foreground">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-[10px] uppercase">Scopes</span>
                    <div className="flex gap-1">
                      {(activePrincipal?.scopes || ["read:data"]).map((s: string) => (
                        <Badge key={s} variant="outline" className="text-[9px] py-0 h-3.5 bg-surface-03 border-border-subtle text-text-muted">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* API Key Status */}
                <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1.5">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">API Key Authentication</div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-secondary">Header:</span>
                    <span className="text-text-muted font-mono">{activeSecurityScenario?.apiKeyScenario ? "x-api-key" : "none"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-secondary">Status:</span>
                    <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-border-default text-text-secondary">
                      {activeSecurityScenario?.apiKeyScenario?.keyPresent ? "VALID KEY" : "MISSING / REVOKED"}
                    </Badge>
                  </div>
                </div>

                {/* Raw Modeled Claims Card */}
                <div className="p-2 rounded-md bg-surface-03 border border-border-subtle">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Raw Modeled Claims</div>
                  <pre className="text-[10px] text-text-secondary overflow-x-auto max-h-36">
                    {JSON.stringify(
                      activePrincipal?.attributes || {
                        sub: activePrincipal?.id || "usr_001",
                        iss: "https://auth.nxtqr.internal",
                        aud: "https://api.nxtqr.internal",
                        roles: activePrincipal?.roles || ["viewer"],
                        tenantId: activePrincipal?.tenantId || "tenant_alpha",
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Authorization & Policies */}
        {activeTab === "authorization" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Left: RBAC Matrix (6 cols) */}
            <div className="col-span-6 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  Role-Based Access Control (RBAC)
                </span>
                <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-border-default text-text-muted">
                  Policy: {activeSecurityScenario?.authzPolicy?.combiningAlgorithm || "deny_overrides"}
                </Badge>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-auto font-mono text-xs">
                <div className="text-[11px] text-text-secondary">
                  Principal Role: <span className="font-semibold text-foreground">{(activePrincipal?.roles || ["viewer"]).join(", ")}</span>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">Standard Action Permissions</div>
                  {[
                    { action: "GET (read)", allowed: true, requiredRole: "viewer, editor, admin" },
                    { action: "POST (create)", allowed: (activePrincipal?.roles || []).some((r: string) => ["editor", "admin"].includes(r)), requiredRole: "editor, admin" },
                    { action: "PUT (update)", allowed: (activePrincipal?.roles || []).some((r: string) => ["editor", "admin"].includes(r)), requiredRole: "editor, admin" },
                    { action: "DELETE (destroy)", allowed: (activePrincipal?.roles || []).includes("admin"), requiredRole: "admin" },
                  ].map((perm) => (
                    <div
                      key={perm.action}
                      className={cn(
                        "p-2 rounded-md border text-[11px] flex items-center justify-between",
                        perm.allowed
                          ? "bg-surface-01 border-border-subtle text-text-secondary"
                          : "bg-surface-04 border-border-strong text-foreground"
                      )}
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-foreground">{perm.action}</span>
                        <div className="text-[10px] text-text-muted">Requires: {perm.requiredRole}</div>
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-mono py-0 h-4 font-bold",
                        perm.allowed ? "border-border-default bg-surface-03 text-foreground" : "border-border-strong bg-surface-03 text-text-secondary"
                      )}>
                        {perm.allowed ? "PERMIT" : "DENY"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: ABAC, Ownership & Tenant Isolation (6 cols) */}
            <div className="col-span-6 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  Attribute-Based (ABAC) & Tenant Boundaries
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  Default: DENY
                </span>
              </div>

              <div className="p-3 space-y-2.5 flex-1 overflow-auto font-mono text-xs">
                {/* Tenant Isolation Boundary */}
                <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-xs">Multi-Tenant Isolation</span>
                    <Badge variant="outline" className={cn(
                      "text-[9px] py-0 h-3.5 font-bold",
                      activeSecurityScenario?.id === "tenant_isolation_denial" ? "border-border-strong bg-surface-03 text-foreground" : "border-border-default text-text-muted"
                    )}>
                      {activeSecurityScenario?.id === "tenant_isolation_denial" ? "CROSS-TENANT VIOLATION" : "ISOLATED & VERIFIED"}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-text-muted">
                    Principal Tenant: <span className="text-foreground">{activePrincipal?.tenantId || "tenant_alpha"}</span> vs Resource: <span className="text-foreground">{activeSecurityScenario?.id === "tenant_isolation_denial" ? "tenant_beta" : "tenant_alpha"}</span>
                  </div>
                </div>

                {/* Resource Ownership */}
                <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-xs">Resource Ownership Check</span>
                    <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-border-default text-text-muted">
                      {activePrincipal?.roles?.includes("admin") ? "BYPASS (ADMIN)" : "OWNER VALIDATED"}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-text-muted">
                    Owner ID: <span className="text-foreground">usr_001</span> | Caller ID: <span className="text-foreground">{activePrincipal?.id || "usr_001"}</span>
                  </div>
                </div>

                {/* ABAC Environmental Conditions */}
                <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-xs">Dynamic ABAC Conditions</span>
                    <Badge variant="outline" className={cn(
                      "text-[9px] py-0 h-3.5 font-bold",
                      activeSecurityScenario?.id === "abac_denial" ? "border-border-strong bg-surface-03 text-foreground" : "border-border-default text-text-muted"
                    )}>
                      {activeSecurityScenario?.id === "abac_denial" ? "CONDITION FAILED" : "SATISFIED"}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-text-muted space-y-1">
                    <div>• Department: <span className="text-foreground">{String(activePrincipal?.attributes?.department || "engineering")}</span></div>
                    <div>• Network Security Level: <span className="text-foreground">secure_corporate</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: WAF & Rate Limiting */}
        {activeTab === "waf_rate_limit" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Left: Web Application Firewall (WAF) (6 cols) */}
            <div className="col-span-6 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  Web Application Firewall (WAF) Engine
                </span>
                <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-border-default text-text-muted">
                  Mode: Blocking
                </Badge>
              </div>

              <div className="p-3 space-y-2 flex-1 overflow-auto font-mono text-xs">
                {(
                  activeSecurityScenario?.wafPolicy?.rules || [
                    { id: "r1", name: "SQL Injection Guard", priority: 1, enabled: true, condition: { type: "suspicious_payload" as const, pattern: "' OR '1'='1", operator: "regex_match" as const }, action: "block" as const, description: "Blocks SQL injection patterns" },
                    { id: "r2", name: "XSS Script Tag Guard", priority: 2, enabled: true, condition: { type: "suspicious_payload" as const, pattern: "<script", operator: "contains" as const }, action: "block" as const, description: "Blocks cross site scripting" },
                    { id: "r3", name: "Payload Size Guard", priority: 3, enabled: true, condition: { type: "payload_size_limit" as const, pattern: 65536, operator: "greater_than" as const }, action: "block" as const, description: "Blocks oversized payloads" },
                    { id: "r4", name: "Malicious CIDR Blocker", priority: 4, enabled: true, condition: { type: "ip_cidr" as const, pattern: "192.0.2.0/24", operator: "cidr_match" as const }, action: "block" as const, description: "Blocks disallowed IP ranges" },
                  ]
                ).map((rule: WafRule) => {
                  const isTriggered = activeSecurityScenario?.id === "waf_sql_injection_block" && rule.id === "r1";
                  return (
                    <div
                      key={rule.id}
                      className={cn(
                        "p-2.5 rounded-md border text-[11px] flex items-center justify-between",
                        isTriggered
                          ? "bg-surface-04 border-border-strong text-foreground shadow-level-2"
                          : "bg-surface-01 border-border-subtle text-text-secondary"
                      )}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{rule.name}</span>
                          <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-border-subtle text-text-muted">
                            {rule.condition.type}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-text-muted">
                          Operator: {rule.condition.operator} | Action: {rule.action.toUpperCase()}
                        </div>
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-mono py-0 h-4 font-bold",
                        isTriggered ? "border-border-strong bg-surface-03 text-foreground" : "border-border-default text-text-muted"
                      )}>
                        {isTriggered ? "TRIGGERED (403)" : "CLEAN"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Token Bucket Rate Limiter (6 cols) */}
            <div className="col-span-6 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  Token Bucket Rate Limiter
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  HTTP 429 Protection
                </span>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-auto font-mono text-xs">
                {/* Gauge Card */}
                <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-secondary font-medium">Bucket Available Tokens</span>
                    <span className="text-foreground font-semibold">
                      {activeSecurityScenario?.id === "rate_limit_rejection" ? "0 / 10" : "8 / 10"}
                    </span>
                  </div>
                  <div className="w-full bg-surface-03 h-2 rounded-md overflow-hidden border border-border-subtle">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        activeSecurityScenario?.id === "rate_limit_rejection" ? "w-0 bg-neutral-600" : "w-4/5 bg-foreground"
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-text-muted pt-1">
                    <span>Capacity: 10 tokens</span>
                    <span>Refill: 5 tokens/sec</span>
                  </div>
                </div>

                {/* Rate Limit Parameters */}
                <div className="p-2.5 rounded-md bg-surface-03 border border-border-subtle space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Partition Key:</span>
                    <span className="text-foreground">IP (198.51.100.24)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Exhaustion Action:</span>
                    <span className="text-foreground">Return HTTP 429 with Retry-After</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Retry-After Header:</span>
                    <span className="text-foreground">5 seconds</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Service Security & mTLS */}
        {activeTab === "mtls" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Left: Mutual TLS Handshake Timeline (6 cols) */}
            <div className="col-span-6 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  mTLS Handshake Sequence (TLS 1.3)
                </span>
                <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-border-default text-text-muted">
                  Cipher: TLS_AES_256_GCM
                </Badge>
              </div>

              <div className="p-3 space-y-2 flex-1 overflow-auto font-mono text-xs">
                {[
                  { step: 1, name: "Client Hello", desc: "Supported cipher suites, TLS 1.3, SNI: mesh.internal", status: "ok" },
                  { step: 2, name: "Server Hello", desc: "Selected TLS_AES_256_GCM, server ephemeral key share", status: "ok" },
                  { step: 3, name: "Server Certificate & Request", desc: "Presents server cert, requests client X.509 cert", status: "ok" },
                  {
                    step: 4,
                    name: "Client Certificate Exchange",
                    desc: activeSecurityScenario?.id === "mtls_cert_expired" ? "Client cert presented but EXPIRED at virtual clock" : "Client cert presented: spiffe://nxtqr.internal/sa/order-service",
                    status: activeSecurityScenario?.id === "mtls_cert_expired" ? "fail" : "ok",
                  },
                  {
                    step: 5,
                    name: "Mutual Trust Verification",
                    desc: activeSecurityScenario?.id === "mtls_cert_expired" ? "Handshake ABORTED with bad_certificate alert" : "Both certificates signed by trusted internal Root CA",
                    status: activeSecurityScenario?.id === "mtls_cert_expired" ? "fail" : "ok",
                  },
                ].map((s) => (
                  <div
                    key={s.step}
                    className={cn(
                      "p-2.5 rounded-md border text-[11px] flex items-center justify-between",
                      s.status === "fail"
                        ? "bg-surface-04 border-border-strong text-foreground shadow-level-1 font-semibold"
                        : "bg-surface-01 border-border-subtle text-text-secondary"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
                        s.status === "ok" ? "bg-surface-03 text-foreground" : "bg-surface-04 text-text-secondary border border-border-strong"
                      )}>
                        {s.status === "ok" ? <CheckIcon className="w-2.5 h-2.5" /> : <CloseIcon className="w-2.5 h-2.5" />}
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">{s.name}</span>
                        <div className="text-[10px] text-text-muted">{s.desc}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-border-subtle text-text-muted">
                      {s.status === "ok" ? "SUCCESS" : "ABORT"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: X.509 Certificate & SPIFFE Identity (6 cols) */}
            <div className="col-span-6 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  Client X.509 Certificate & SPIFFE Mesh ID
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  Mesh Security
                </span>
              </div>

              <div className="p-3 space-y-2.5 flex-1 overflow-auto font-mono text-xs">
                <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-[10px] uppercase">Subject DN:</span>
                    <span className="text-foreground font-semibold">CN=order-service.internal</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-[10px] uppercase">SPIFFE ID:</span>
                    <span className="text-text-secondary font-mono text-[10px]">spiffe://nxtqr.internal/sa/order-service</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-[10px] uppercase">Issuer:</span>
                    <span className="text-foreground">NXTQR Mesh Root CA v2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-[10px] uppercase">Validity:</span>
                    <Badge variant="outline" className={cn(
                      "text-[9px] py-0 h-3.5 font-bold",
                      activeSecurityScenario?.id === "mtls_cert_expired" ? "border-border-strong bg-surface-03 text-foreground" : "border-border-default text-text-muted"
                    )}>
                      {activeSecurityScenario?.id === "mtls_cert_expired" ? "EXPIRED CERTIFICATE" : "VALID (365 DAYS)"}
                    </Badge>
                  </div>
                </div>

                <div className="p-2.5 rounded-md bg-surface-03 border border-border-subtle space-y-1 text-[10px] text-text-secondary">
                  <div className="text-text-muted uppercase tracking-wider mb-1">Zero-Trust Network Enforcement</div>
                  <div>• Traffic between nodes is strictly encrypted end-to-end.</div>
                  <div>• Plaintext TCP connections rejected at container boundary.</div>
                  <div>• SPIFFE ID authenticated before any RPC payload dispatch.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: OAuth 2.0 Sequence */}
        {activeTab === "oauth" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Left: Sequence Diagram (7 cols) */}
            <div className="col-span-7 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  OAuth 2.0 / OIDC Sequence Visualization
                </span>
                <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-border-default text-text-muted">
                  {activeSecurityScenario?.id === "oauth_client_credentials" ? "CLIENT CREDENTIALS (M2M)" : "AUTH CODE + PKCE"}
                </Badge>
              </div>

              <div className="p-3 space-y-2 flex-1 overflow-auto font-mono text-xs">
                {[
                  { step: 1, title: "1. Code Challenge Generation", description: "Client creates code_verifier and code_challenge = SHA256(verifier)", actor: "Browser / SPA" },
                  { step: 2, title: "2. Authorization Request", description: "GET /authorize?response_type=code&code_challenge=...", actor: "IdP Endpoint" },
                  { step: 3, title: "3. User Authentication & Consent", description: "User enters credentials, confirms requested scopes", actor: "Identity Provider" },
                  { step: 4, title: "4. Authorization Code Issued", description: "302 Redirect to client with auth_code = 'auth_code_xyz123'", actor: "IdP -> Client" },
                  { step: 5, title: "5. Token Exchange with Verifier", description: "POST /token with code + code_verifier", actor: "Client Backend" },
                  { step: 6, title: "6. PKCE Verification & Token Issuance", description: "IdP verifies SHA256(verifier) === code_challenge, issues JWT", actor: "IdP -> Client" },
                ].map((s) => (
                  <div key={s.step} className="p-2.5 rounded-md bg-surface-01 border border-border-subtle flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{s.title}</span>
                        <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-border-subtle text-text-muted">
                          {s.actor}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">{s.description}</div>
                    </div>
                    <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-border-default bg-surface-03 text-foreground font-bold">
                      DONE
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Issued Tokens & Proofs (5 cols) */}
            <div className="col-span-5 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  Modeled Token Artifacts
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  Bearer Token
                </span>
              </div>

              <div className="p-3 space-y-2.5 flex-1 overflow-auto font-mono text-xs">
                <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1">
                  <span className="text-[10px] text-text-muted uppercase">Access Token (JWT)</span>
                  <div className="text-[10px] text-foreground font-mono truncate">
                    eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMDAxIn0...
                  </div>
                  <div className="text-[9px] text-text-muted">Type: Bearer | Expires: in 3600s</div>
                </div>

                <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1">
                  <span className="text-[10px] text-text-muted uppercase">ID Token (OpenID Connect)</span>
                  <div className="text-[10px] text-text-secondary font-mono truncate">
                    eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiQWxpY2UifQ...
                  </div>
                  <div className="text-[9px] text-text-muted">Profile: Alice (alice@company.com)</div>
                </div>

                <div className="p-2.5 rounded-md bg-surface-03 border border-border-subtle space-y-1 text-[10px] text-text-secondary">
                  <div className="text-text-muted uppercase tracking-wider mb-1">PKCE Protection (RFC 7636)</div>
                  <div>• Mitigates authorization code interception attacks.</div>
                  <div>• Prevents public clients from requiring client secrets.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
