"use client";

import * as React from "react";
import {
  CloseIcon,
  CpuIcon,
  DatabaseIcon,
  PlayIcon,
  RefreshIcon,
  ShieldIcon,
} from "@nxtqr/icons";
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";
import {
  ZERO_TRUST_PRESET_METADATA,
  compareZeroTrustScenarios,
  createZeroTrustPresetScenario,
  type ZeroTrustPresetId,
} from "@nxtqr/architecture-execution";

type ZeroTrustTab =
  | "zero_trust_policy"
  | "zones_boundaries"
  | "identities_secrets"
  | "stride_attack_paths"
  | "blast_mitigations"
  | "invariants_caveats";

const COMPARE_PAIRS: Array<{
  id: string;
  label: string;
  baseline: ZeroTrustPresetId;
  variant: ZeroTrustPresetId;
}> = [
  {
    id: "priv_vs_zt",
    label: "Overprivileged Role vs Zero Trust Baseline",
    baseline: "overprivileged_service_role",
    variant: "zt_baseline",
  },
  {
    id: "flat_vs_deny",
    label: "Missing Segmentation vs Default-Deny Policy",
    baseline: "missing_network_segmentation",
    variant: "default_deny_network_policy",
  },
  {
    id: "comp_vs_revoke",
    label: "Compromised Token vs Revocation Mitigation",
    baseline: "synthetic_credential_compromise",
    variant: "credential_revocation",
  },
  {
    id: "dos_vs_rl",
    label: "Synthetic DoS vs Rate-Limit Mitigation",
    baseline: "synthetic_dos",
    variant: "rate_limit_mitigation",
  },
];

export function ZeroTrustWorkspace() {
  const toggleZeroTrustWorkspace = useExecutionStore(
    (s) => s.toggleZeroTrustWorkspace
  );
  const activeZeroTrustScenario = useExecutionStore(
    (s) => s.activeZeroTrustScenario
  );
  const setZeroTrustScenario = useExecutionStore(
    (s) => s.setZeroTrustScenario
  );
  const setScenarioPreset = useExecutionStore((s) => s.setScenarioPreset);
  const runZeroTrustSimulation = useExecutionStore(
    (s) => s.runZeroTrustSimulation
  );
  const currentFrame = useExecutionStore((s) => s.playbackState.currentFrame);
  const trace = useExecutionStore((s) => s.trace);

  const [activeTab, setActiveTab] =
    React.useState<ZeroTrustTab>("zero_trust_policy");
  const [strideFilter, setStrideFilter] = React.useState<string>("ALL");
  const [comparePairId, setComparePairId] =
    React.useState<string>("priv_vs_zt");
  const [adhocPrincipal, setAdhocPrincipal] = React.useState<string>("");
  const [adhocResource, setAdhocResource] = React.useState<string>("");
  const [adhocAction, setAdhocAction] = React.useState<string>("read");

  React.useEffect(() => {
    if (!activeZeroTrustScenario) {
      const def = createZeroTrustPresetScenario("zt_baseline");
      setZeroTrustScenario(def);
    }
  }, [activeZeroTrustScenario, setZeroTrustScenario]);

  const scenario =
    activeZeroTrustScenario ?? createZeroTrustPresetScenario("zt_baseline");

  React.useEffect(() => {
    if (scenario.identities[0] && !adhocPrincipal) {
      setAdhocPrincipal(scenario.identities[0].id);
    }
    if (scenario.resources[1] && !adhocResource) {
      setAdhocResource(scenario.resources[1].id);
    }
  }, [scenario, adhocPrincipal, adhocResource]);

  const ztState = React.useMemo(() => {
    if (currentFrame?.runtimeState?.zeroTrustState) {
      return currentFrame.runtimeState.zeroTrustState;
    }
    if (trace && trace.frames.length > 0) {
      for (let i = trace.frames.length - 1; i >= 0; i--) {
        if (trace.frames[i]?.runtimeState?.zeroTrustState) {
          return trace.frames[i]!.runtimeState!.zeroTrustState!;
        }
      }
    }
    return null;
  }, [currentFrame, trace]);

  const comparisonResult = React.useMemo(() => {
    const pair =
      COMPARE_PAIRS.find((p) => p.id === comparePairId) ?? COMPARE_PAIRS[0]!;
    return compareZeroTrustScenarios(
      createZeroTrustPresetScenario(pair.baseline),
      createZeroTrustPresetScenario(pair.variant)
    );
  }, [comparePairId]);

  const handleToggleViewMode = () => {
    const nextMode: "investigation" | "explanation" =
      scenario.viewMode === "investigation" ? "explanation" : "investigation";
    runZeroTrustSimulation({ ...scenario, viewMode: nextMode });
  };

  const handleSubmitAdhocRequest = () => {
    const pId = adhocPrincipal || scenario.identities[0]!.id;
    const rId = adhocResource || scenario.resources[0]!.id;
    const atMs = Math.max(90, (ztState?.virtualTimeMs ?? 80) + 30);
    const updated = {
      ...scenario,
      requests: [
        ...scenario.requests,
        {
          id: `req_adhoc_${scenario.requests.length + 1}`,
          atMs,
          principalId: pId,
          sourceNodeId: pId,
          resourceId: rId,
          action: adhocAction,
          protocol: "HTTPS" as const,
          port: 443,
          expectedAllowed: true,
          environmentAttributes: {},
          description: `Simulated Zero Trust evaluation: ${pId} -> ${rId}:${adhocAction}`,
        },
      ],
    };
    runZeroTrustSimulation(updated);
  };

  const handleApplyQuickMitigation = (
    action:
      | "revoke_credential"
      | "reduce_role_permissions"
      | "enable_network_restriction"
      | "require_mtls"
      | "enforce_default_deny",
    targetId: string
  ) => {
    const atMs = Math.max(120, (ztState?.virtualTimeMs ?? 100) + 40);
    const updated = {
      ...scenario,
      mitigations: [
        ...scenario.mitigations,
        {
          id: `mit_ui_${scenario.mitigations.length + 1}`,
          atMs,
          action,
          targetId,
          description: `Defensive control (${action}) applied to ${targetId}`,
        },
      ],
    };
    runZeroTrustSimulation(updated);
  };

  const identitiesList = React.useMemo(
    () => (ztState ? Object.values(ztState.identities) : []),
    [ztState]
  );
  const resourcesList = React.useMemo(
    () => (ztState ? Object.values(ztState.resources) : []),
    [ztState]
  );
  const tokensList = React.useMemo(
    () => (ztState ? Object.values(ztState.tokens) : []),
    [ztState]
  );
  const certsList = React.useMemo(
    () => (ztState ? Object.values(ztState.certificates) : []),
    [ztState]
  );
  const secretsList = React.useMemo(
    () => (ztState ? Object.values(ztState.secrets) : []),
    [ztState]
  );

  const filteredAttackPaths = React.useMemo(() => {
    if (!ztState) return [];
    if (strideFilter === "ALL") return ztState.attackPaths;
    return ztState.attackPaths.filter((ap) => ap.category === strideFilter);
  }, [ztState, strideFilter]);

  return (
    <div
      role="region"
      aria-label="Distributed Security, Zero Trust and Threat Modeling Workspace"
      className="fixed bottom-4 right-4 z-40 w-[960px] max-w-[calc(100vw-2rem)] h-[660px] max-h-[calc(100vh-5rem)] flex flex-col rounded-md bg-surface-02 border border-border-default shadow-level-2 overflow-hidden select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border-subtle bg-surface-01 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldIcon className="w-4 h-4 text-foreground shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xs font-mono font-semibold text-foreground truncate">
              Zero Trust Security & Threat Modeling Studio
            </h2>
            <p className="text-[10px] font-mono text-text-muted truncate">
              Trust Boundaries · RBAC/ABAC · mTLS · STRIDE · Abstract Attack Paths · Blast Radius
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <Select
            value={scenario.presetId ?? "zt_baseline"}
            onValueChange={(val) => setScenarioPreset(val as ZeroTrustPresetId)}
          >
            <SelectTrigger className="h-7 w-[210px] text-[10px] font-mono bg-surface-03 border-border-default rounded-md">
              <SelectValue placeholder="Security Preset" />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-default rounded-md max-h-[320px]">
              {ZERO_TRUST_PRESET_METADATA.map((meta) => (
                <SelectItem
                  key={meta.id}
                  value={meta.id}
                  className="text-[10px] font-mono"
                >
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleViewMode}
            title="Toggle Investigation Mode (observable evidence only) vs Explanation Mode (verified simulated threat chain)"
            className={cn(
              "h-7 px-2 text-[10px] font-mono rounded-md border",
              scenario.viewMode === "explanation"
                ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                : "bg-surface-01 border-border-default text-text-secondary hover:bg-surface-03"
            )}
          >
            {scenario.viewMode === "investigation"
              ? "Mode: Investigation"
              : "Mode: Explanation"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleApplyQuickMitigation(
                "enforce_default_deny",
                scenario.resources[0]?.id ?? "orders-api"
              )
            }
            className="h-7 px-2 text-[10px] font-mono bg-surface-01 border-border-default hover:bg-surface-03 rounded-md"
          >
            Default Deny
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => runZeroTrustSimulation(scenario)}
            className="h-7 px-2.5 text-[10px] font-mono bg-foreground text-background hover:bg-neutral-200 rounded-md gap-1"
          >
            <PlayIcon className="w-3 h-3" />
            Run
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleZeroTrustWorkspace(false)}
            aria-label="Close Zero Trust Security Workspace"
            className="h-7 w-7 p-0 rounded-md text-text-muted hover:text-foreground hover:bg-surface-03"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Modeled Metrics Strip */}
      <div className="grid grid-cols-6 gap-1.5 px-3 py-1.5 border-b border-border-subtle bg-surface-01 shrink-0">
        <div className="px-2 py-1 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Allowed / Denied
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {ztState
              ? `${ztState.metrics.allowedRequests} / ${ztState.metrics.deniedRequests}`
              : "0 / 0"}
          </div>
        </div>
        <div className="px-2 py-1 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Auth / Authz Fail
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {ztState
              ? `${ztState.metrics.authenticationFailures} / ${ztState.metrics.authorizationFailures}`
              : "0 / 0"}
          </div>
        </div>
        <div className="px-2 py-1 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Net / mTLS Deny
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {ztState
              ? `${ztState.metrics.networkDenials} / ${ztState.metrics.transportFailures}`
              : "0 / 0"}
          </div>
        </div>
        <div className="px-2 py-1 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Blocked / Reached
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {ztState
              ? `${ztState.metrics.blockedAttackSteps} / ${ztState.metrics.completedAttackSteps}`
              : "0 / 0"}
          </div>
        </div>
        <div className="px-2 py-1 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Control Eff.
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {ztState ? `${ztState.metrics.controlEffectivenessPct}%` : "100%"}
          </div>
        </div>
        <div className="px-2 py-1 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Modeled Risk
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {ztState ? `${ztState.metrics.residualRiskScore}` : "0"}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border-subtle bg-surface-01 shrink-0 overflow-x-auto">
        {(
          [
            { id: "zero_trust_policy", label: "Zero Trust & Policy Debugger" },
            { id: "zones_boundaries", label: "Zones, Boundaries & Transport" },
            { id: "identities_secrets", label: "Identities, Tokens & Secrets" },
            { id: "stride_attack_paths", label: "STRIDE & Attack Paths" },
            { id: "blast_mitigations", label: "Blast Radius & Mitigations" },
            { id: "invariants_caveats", label: "Invariants & Caveats" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-2.5 py-1 rounded-md text-[10px] font-mono transition-colors border whitespace-nowrap",
              activeTab === tab.id
                ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                : "bg-transparent border-transparent text-text-muted hover:text-foreground hover:bg-surface-03"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
        {!ztState ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-6 rounded-md bg-surface-01 border border-border-subtle">
            <ShieldIcon className="w-6 h-6 text-text-secondary" />
            <div className="space-y-1 max-w-md">
              <p className="text-xs font-mono font-semibold text-foreground">
                Ready to run Zero Trust security simulation
              </p>
              <p className="text-[11px] font-mono text-text-muted">
                {scenario.label} — deterministic authentication, RBAC/ABAC, trust boundaries, abstract attack paths, and mitigation verification.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => runZeroTrustSimulation(scenario)}
              className="h-7 px-3 text-[11px] font-mono bg-foreground text-background hover:bg-neutral-200 rounded-md gap-1.5"
            >
              <PlayIcon className="w-3 h-3" />
              Run Security Simulation
            </Button>
          </div>
        ) : (
          <>
            {/* TAB 1: Zero Trust & Policy Debugger */}
            {activeTab === "zero_trust_policy" && (
              <div className="space-y-3">
                {/* Interactive Simulated Access Decision Evaluator */}
                <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2 text-[10px] font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      Simulated Zero Trust Access Decision Tester
                    </span>
                    <span className="text-[9px] text-text-muted">
                      Internal network location never overrides policy evaluation
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select
                      value={adhocPrincipal}
                      onValueChange={setAdhocPrincipal}
                    >
                      <SelectTrigger className="h-7 w-[170px] text-[10px] font-mono bg-surface-01 border-border-default rounded-md">
                        <SelectValue placeholder="Principal" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-02 border-border-default rounded-md">
                        {scenario.identities.map((id) => (
                          <SelectItem
                            key={id.id}
                            value={id.id}
                            className="text-[10px] font-mono"
                          >
                            {id.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <span className="text-text-muted">→</span>

                    <Select
                      value={adhocResource}
                      onValueChange={setAdhocResource}
                    >
                      <SelectTrigger className="h-7 w-[170px] text-[10px] font-mono bg-surface-01 border-border-default rounded-md">
                        <SelectValue placeholder="Target Resource" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-02 border-border-default rounded-md">
                        {scenario.resources.map((r) => (
                          <SelectItem
                            key={r.id}
                            value={r.id}
                            className="text-[10px] font-mono"
                          >
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={adhocAction} onValueChange={setAdhocAction}>
                      <SelectTrigger className="h-7 w-[105px] text-[10px] font-mono bg-surface-01 border-border-default rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-02 border-border-default rounded-md">
                        {["read", "write", "admin"].map((act) => (
                          <SelectItem
                            key={act}
                            value={act}
                            className="text-[10px] font-mono"
                          >
                            {act}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      size="sm"
                      onClick={handleSubmitAdhocRequest}
                      className="h-7 px-2.5 text-[10px] font-mono bg-foreground text-background hover:bg-neutral-200 rounded-md gap-1"
                    >
                      <PlayIcon className="w-3 h-3" />
                      Evaluate Request
                    </Button>
                  </div>
                </div>

                {/* Evaluated Access Decisions */}
                <div className="space-y-2">
                  {[...ztState.accessDecisions].reverse().map((dec) => (
                    <div
                      key={dec.requestId}
                      className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2 text-[10px] font-mono"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded-md border text-[9px] uppercase font-semibold",
                              dec.effect === "allow"
                                ? "bg-surface-04 border-border-strong text-foreground"
                                : "bg-surface-01 border-border-default text-text-secondary"
                            )}
                          >
                            {dec.effect}
                          </span>
                          <span className="font-semibold text-foreground">
                            {dec.principalId}
                          </span>
                          <span className="text-text-muted">→</span>
                          <span className="font-semibold text-foreground">
                            {dec.resourceId}:{dec.action}
                          </span>
                        </div>
                        <span className="text-[9px] text-text-muted">
                          auth: {dec.authState} · @ {dec.evaluatedAtMs}ms
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-1.5">
                        {dec.steps.map((st, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "p-1.5 rounded-md border space-y-0.5",
                              st.passed
                                ? "bg-surface-01 border-border-subtle"
                                : "bg-surface-03 border-border-strong"
                            )}
                          >
                            <div className="flex items-center justify-between text-[9px]">
                              <span className="text-foreground font-semibold truncate">
                                {st.stage.replace(/_/g, " ")}
                              </span>
                              <span className="text-foreground">
                                {st.indeterminate
                                  ? "INDET"
                                  : st.passed
                                    ? "PASS"
                                    : "FAIL"}
                              </span>
                            </div>
                            <div className="text-[9px] text-text-muted leading-tight">
                              {st.detail}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: Zones, Boundaries & Transport */}
            {activeTab === "zones_boundaries" && (
              <div className="space-y-3 text-[10px] font-mono">
                <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      Security Topology & Trust Boundaries
                    </span>
                    <span className="text-[9px] text-text-muted">
                      {ztState.trustBoundaries.length} trust boundaries ·{" "}
                      {resourcesList.length} assets
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {ztState.trustBoundaries.map((tb) => (
                      <div
                        key={tb.id}
                        className="p-2 rounded-md bg-surface-01 border border-border-subtle space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            {tb.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono border-border-default uppercase"
                          >
                            {tb.policyState}
                          </Badge>
                        </div>
                        <div className="text-[9px] text-text-muted">
                          {tb.fromZoneId} ↔ {tb.toZoneId} ({tb.type}) · Crossings:{" "}
                          {tb.crossingCount} · Blocked: {tb.blockedCrossings}
                        </div>
                        <div className="text-[9px] text-text-secondary">
                          Protected: {tb.protectedResourceIds.join(", ") || "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transport & Encryption Boundaries */}
                <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      Resources, Data Classification & Encryption Boundaries
                    </span>
                    <span className="text-[9px] text-text-muted">
                      Active computation processes data in plaintext memory
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {resourcesList.map((res) => (
                      <div
                        key={res.id}
                        className="p-2 rounded-md bg-surface-01 border border-border-subtle space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {res.kind === "database" || res.kind === "cache" ? (
                              <DatabaseIcon className="w-3.5 h-3.5 text-text-secondary" />
                            ) : (
                              <CpuIcon className="w-3.5 h-3.5 text-text-secondary" />
                            )}
                            <span className="font-semibold text-foreground">
                              {res.label}
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded-md bg-surface-02 border border-border-default text-[9px] uppercase">
                            {res.classification}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-text-muted">
                          <span>Zone: {res.zoneId}</span>
                          <span>Transport: {res.transportSecurity.toUpperCase()}</span>
                          <span>At-rest: {res.encryptedAtRest ? "Encrypted" : "Plain"}</span>
                        </div>
                        {res.transportSecurity === "plaintext" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleApplyQuickMitigation("require_mtls", res.id)
                            }
                            className="h-6 px-2 text-[9px] font-mono rounded-md bg-surface-02 border-border-default hover:bg-surface-03"
                          >
                            Enforce mTLS
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Identities, Tokens & Secrets */}
            {activeTab === "identities_secrets" && (
              <div className="space-y-3 text-[10px] font-mono">
                <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
                  <span className="font-semibold text-foreground">
                    Principal & Workload Identities ({identitiesList.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {identitiesList.map((id) => (
                      <div
                        key={id.id}
                        className="p-2 rounded-md bg-surface-01 border border-border-subtle space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            {id.label}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-surface-02 border border-border-default text-[9px]">
                            {id.compromised ? "COMPROMISED" : id.authState}
                          </span>
                        </div>
                        <div className="text-[9px] text-text-muted">
                          Type: {id.principalType} · Tenant: {id.tenantId}
                        </div>
                        <div className="text-[9px] text-text-secondary">
                          Roles: {id.roles.join(", ") || "none"} · Accessible:{" "}
                          {id.accessibleResourceIds.join(", ") || "none"}
                        </div>
                        {id.compromised && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleApplyQuickMitigation(
                                "revoke_credential",
                                id.id
                              )
                            }
                            className="h-6 px-2 text-[9px] font-mono rounded-md bg-surface-03 border-border-strong text-foreground"
                          >
                            Revoke Compromised Credential
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tokens, Certificates, Secrets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1.5">
                    <div className="font-semibold text-foreground">
                      Simulated Tokens (Metadata Only)
                    </div>
                    {tokensList.map((t) => (
                      <div
                        key={t.id}
                        className="p-1.5 rounded-md bg-surface-01 border border-border-subtle space-y-0.5 text-[9px]"
                      >
                        <div className="flex justify-between text-foreground font-semibold">
                          <span>{t.id}</span>
                          <span>{t.revoked ? "REVOKED" : "ACTIVE"}</span>
                        </div>
                        <div className="text-text-muted">
                          sub: {t.subjectId} · aud: {t.audience.join(", ")}
                        </div>
                        <div className="text-text-muted">
                          exp: {t.expiresAtMs}ms · scopes: {t.scopes.join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1.5">
                    <div className="font-semibold text-foreground">
                      mTLS Certificates
                    </div>
                    {certsList.map((c) => (
                      <div
                        key={c.id}
                        className="p-1.5 rounded-md bg-surface-01 border border-border-subtle space-y-0.5 text-[9px]"
                      >
                        <div className="flex justify-between text-foreground font-semibold">
                          <span>{c.subjectId}</span>
                          <span className="uppercase">{c.lifecycleState}</span>
                        </div>
                        <div className="text-text-muted truncate">
                          {c.spiffeId}
                        </div>
                        <div className="text-text-muted">
                          issuer: {c.issuerId} ({c.trustedIssuer ? "trusted" : "untrusted"})
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1.5">
                    <div className="font-semibold text-foreground">
                      Secrets Lifecycle (No Raw Values)
                    </div>
                    {secretsList.map((sec) => (
                      <div
                        key={sec.id}
                        className="p-1.5 rounded-md bg-surface-01 border border-border-subtle space-y-0.5 text-[9px]"
                      >
                        <div className="flex justify-between text-foreground font-semibold">
                          <span>
                            {sec.name} (v{sec.version})
                          </span>
                          <span className="uppercase">{sec.rotationState}</span>
                        </div>
                        <div className="text-text-muted">
                          Consumers: {sec.allowedConsumerIds.join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: STRIDE & Attack Paths */}
            {activeTab === "stride_attack_paths" && (
              <div className="space-y-3 text-[10px] font-mono">
                <div className="flex items-center gap-1 flex-wrap p-2 rounded-md bg-surface-02 border border-border-default">
                  {(
                    [
                      "ALL",
                      "spoofing",
                      "tampering",
                      "repudiation",
                      "information_disclosure",
                      "denial_of_service",
                      "elevation_of_privilege",
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setStrideFilter(cat)}
                      className={cn(
                        "px-2 py-1 rounded-md border text-[9px] uppercase",
                        strideFilter === cat
                          ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                          : "bg-surface-01 border-border-subtle text-text-muted hover:text-foreground"
                      )}
                    >
                      {cat.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>

                {filteredAttackPaths.length === 0 ? (
                  <div className="p-4 rounded-md bg-surface-02 border border-border-default text-center text-text-secondary">
                    No abstract attack paths configured or matched for this STRIDE category.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAttackPaths.map((ap) => (
                      <div
                        key={ap.threatId}
                        className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-foreground">
                              {ap.title}
                            </span>{" "}
                            <span className="text-text-muted">
                              ({ap.category.replace(/_/g, " ")})
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono uppercase border-border-strong text-foreground"
                          >
                            {ap.status.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          {ap.steps.map((st, idx) => (
                            <div
                              key={st.id}
                              className={cn(
                                "p-2 rounded-md border flex items-center justify-between gap-2",
                                st.outcome === "blocked"
                                  ? "bg-surface-01 border-border-subtle text-text-secondary"
                                  : "bg-surface-03 border-border-strong text-foreground"
                              )}
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div>
                                  Step {idx + 1}:{" "}
                                  <span className="font-semibold">
                                    {st.sourceNodeId} → {st.targetNodeId}
                                  </span>
                                </div>
                                <div className="text-[9px] text-text-muted">
                                  {st.explanation}
                                </div>
                              </div>
                              <span className="px-1.5 py-0.5 rounded-md border border-border-default bg-surface-02 text-[9px] uppercase shrink-0">
                                {st.outcome.replace(/_/g, " ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Grayscale Risk Matrix */}
                {ztState.riskMatrix.length > 0 && (
                  <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1.5">
                    <div className="font-semibold text-foreground">
                      Threat Risk Matrix (Modeled Assumptions)
                    </div>
                    {ztState.riskMatrix.map((rm) => (
                      <div
                        key={rm.threatId}
                        className="p-2 rounded-md bg-surface-01 border border-border-subtle flex items-center justify-between gap-2 text-[9px]"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground">
                            {rm.title} ({rm.category})
                          </div>
                          <div className="text-text-muted">
                            {rm.recommendedMitigation}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span>L:{rm.likelihood}</span>
                          <span>I:{rm.impact}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-surface-03 border border-border-strong text-foreground font-semibold uppercase">
                            Residual: {rm.residualRisk}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: Blast Radius, Incidents & Mitigations */}
            {activeTab === "blast_mitigations" && (
              <div className="space-y-3 text-[10px] font-mono">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-2 rounded-md bg-surface-02 border border-border-default">
                    <div className="text-[9px] text-text-muted">
                      Direct Access
                    </div>
                    <div className="text-foreground font-semibold mt-0.5">
                      {ztState.blastRadius.directAccessResourceIds.join(", ") ||
                        "None"}
                    </div>
                  </div>
                  <div className="p-2 rounded-md bg-surface-02 border border-border-default">
                    <div className="text-[9px] text-text-muted">
                      Conditional Access
                    </div>
                    <div className="text-foreground mt-0.5">
                      {ztState.blastRadius.conditionalAccessResourceIds.join(
                        ", "
                      ) || "None"}
                    </div>
                  </div>
                  <div className="p-2 rounded-md bg-surface-02 border border-border-default">
                    <div className="text-[9px] text-text-muted">
                      Blocked Access
                    </div>
                    <div className="text-text-secondary mt-0.5">
                      {ztState.blastRadius.blockedResourceIds.join(", ") ||
                        "None"}
                    </div>
                  </div>
                  <div className="p-2 rounded-md bg-surface-02 border border-border-strong">
                    <div className="text-[9px] text-text-muted">
                      Sensitive Exposed
                    </div>
                    <div className="text-foreground font-semibold mt-0.5">
                      {ztState.blastRadius.sensitiveAssetsExposed.join(", ") ||
                        "None (0)"}
                    </div>
                  </div>
                </div>

                {/* Defensive Control Evaluation & Quick Mitigations */}
                <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-semibold text-foreground">
                      Defensive Controls & Mitigation Simulator
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleApplyQuickMitigation(
                            "reduce_role_permissions",
                            scenario.identities[0]?.id ?? "checkout-svc"
                          )
                        }
                        className="h-6 px-2 text-[9px] font-mono rounded-md bg-surface-01 border-border-default hover:bg-surface-03"
                      >
                        Apply Least Privilege
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleApplyQuickMitigation(
                            "enable_network_restriction",
                            "orders-db"
                          )
                        }
                        className="h-6 px-2 text-[9px] font-mono rounded-md bg-surface-01 border-border-default hover:bg-surface-03"
                      >
                        Segment Orders DB
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {ztState.controls.map((c) => (
                      <div
                        key={c.controlId}
                        className="p-2 rounded-md bg-surface-01 border border-border-subtle flex items-center justify-between gap-2 text-[9px]"
                      >
                        <div>
                          <div className="font-semibold text-foreground">
                            {c.name} ({c.kind})
                          </div>
                          <div className="text-text-muted">{c.reason}</div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded-md bg-surface-02 border border-border-default uppercase shrink-0">
                          {c.state}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Before/After Comparison */}
                <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">
                      Security Posture Comparison
                    </span>
                    <Select
                      value={comparePairId}
                      onValueChange={setComparePairId}
                    >
                      <SelectTrigger className="h-7 w-[280px] text-[10px] font-mono bg-surface-03 border-border-default rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-02 border-border-default rounded-md">
                        {COMPARE_PAIRS.map((p) => (
                          <SelectItem
                            key={p.id}
                            value={p.id}
                            className="text-[10px] font-mono"
                          >
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                      <div className="text-[9px] text-text-muted">
                        Reachable Assets Delta
                      </div>
                      <div className="text-foreground font-semibold">
                        {comparisonResult.deltas.reachableResourcesDelta}
                      </div>
                    </div>
                    <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                      <div className="text-[9px] text-text-muted">
                        Blocked Attack Steps Delta
                      </div>
                      <div className="text-foreground font-semibold">
                        {comparisonResult.deltas.blockedAttackStepsDelta > 0
                          ? `+${comparisonResult.deltas.blockedAttackStepsDelta}`
                          : comparisonResult.deltas.blockedAttackStepsDelta}
                      </div>
                    </div>
                    <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                      <div className="text-[9px] text-text-muted">
                        Control Eff. Delta
                      </div>
                      <div className="text-foreground font-semibold">
                        {comparisonResult.deltas.controlEffectivenessPctDelta}%
                      </div>
                    </div>
                    <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                      <div className="text-[9px] text-text-muted">
                        Residual Risk Delta
                      </div>
                      <div className="text-foreground font-semibold">
                        {comparisonResult.deltas.residualRiskScoreDelta}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Threat Model Report & Incidents */}
                {ztState.report && (
                  <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {ztState.report.title}
                      </span>
                      <span className="text-[9px] text-text-muted">
                        {ztState.incidents.length} security incident(s)
                      </span>
                    </div>
                    <div className="text-[9px] text-text-secondary">
                      {ztState.report.findingsSummary} ·{" "}
                      {ztState.report.mitigationSummary}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: Invariants & Caveats */}
            {activeTab === "invariants_caveats" && (
              <div className="space-y-3 text-[10px] font-mono">
                <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Zero Trust Correctness Invariants
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono border-border-strong text-foreground"
                    >
                      {ztState.invariants.allPassed
                        ? "10 / 10 PASSED"
                        : `${ztState.invariants.violations.length} VIOLATIONS`}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {(
                      [
                        [
                          "Default Deny Enforced",
                          ztState.invariants.defaultDenyEnforcedOk,
                        ],
                        [
                          "Expired Credentials Rejected",
                          ztState.invariants.expiredCredentialsRejectedOk,
                        ],
                        [
                          "Revoked Credentials Rejected",
                          ztState.invariants.revokedCredentialsRejectedOk,
                        ],
                        [
                          "Invalid Audiences Rejected",
                          ztState.invariants.invalidAudiencesRejectedOk,
                        ],
                        [
                          "Cross-Tenant Isolation Respected",
                          ztState.invariants.crossTenantIsolationOk,
                        ],
                        [
                          "Network Policies Consistent",
                          ztState.invariants.networkPoliciesConsistentOk,
                        ],
                        [
                          "Attack Prerequisites Enforced",
                          ztState.invariants.attackPrerequisitesRespectedOk,
                        ],
                        [
                          "Blocked Steps Grant Zero Access",
                          ztState.invariants.blockedStepsDoNotGrantAccessOk,
                        ],
                        [
                          "Blast Radius Partition Valid",
                          ztState.invariants.blastRadiusConsistentOk,
                        ],
                        [
                          "Ground Truth Mode Separated",
                          ztState.invariants.groundTruthSeparatedOk,
                        ],
                      ] as const
                    ).map(([label, ok]) => (
                      <div
                        key={label}
                        className="px-2 py-1.5 rounded-md bg-surface-01 border border-border-subtle flex items-center justify-between"
                      >
                        <span className="text-text-secondary">{label}</span>
                        <span className="text-foreground font-semibold">
                          {ok ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      Security Modeling Caveats & Simulation Boundaries
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runZeroTrustSimulation(scenario)}
                      className="h-6 px-2 text-[9px] font-mono rounded-md gap-1 hover:bg-surface-03"
                    >
                      <RefreshIcon className="w-3 h-3" />
                      Re-verify
                    </Button>
                  </div>
                  {ztState.caveats.map((cav, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-md bg-surface-01 border border-border-subtle text-[9px] text-text-secondary"
                    >
                      • {cav}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
