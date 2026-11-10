"use client";

import * as React from "react";
import Link from "next/link";
import {
  securityAnalysisEngine,
  type SecurityAnalysisReport,
  type SecurityFinding,
  SECURITY_RECOMMENDATIONS_CATALOG,
} from "@nxtqr/architecture-intelligence";
import {
  ShieldIcon,
  LockIcon,
} from "@nxtqr/icons";
import {
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { TrustBoundaryExplorer } from "@/features/system-design/security-analysis/components/trust-boundary-explorer";

const PRESET_TOPOLOGIES: Record<
  string,
  { name: string; description: string; nodes: BaseNode[]; edges: BaseEdge[] }
> = {
  public_ingress_gaps: {
    name: "Public Ingress Without Auth & Rate Limiting",
    description: "Public-facing API Gateway without modeled authentication service or rate limiting controls accepting traffic from web clients.",
    nodes: [
      { id: "browser", type: "infrastructure", position: { x: 0, y: 0 }, data: { componentType: "web-browser", label: "Web Client", exposure: "public" } },
      { id: "api_gw", type: "infrastructure", position: { x: 180, y: 0 }, data: { componentType: "api-gateway", label: "Public API Gateway", exposure: "public" } },
      { id: "order_svc", type: "infrastructure", position: { x: 360, y: 0 }, data: { componentType: "compute-instance", label: "Order Service", exposure: "internal" } },
    ],
    edges: [
      { id: "e1", source: "browser", target: "api_gw", data: { protocol: "https", encryptionInTransit: true } },
      { id: "e2", source: "api_gw", target: "order_svc", data: { protocol: "grpc/tls", encryptionInTransit: true } },
    ],
  },
  unsegmented_database_exposure: {
    name: "Unsegmented Database Exposure",
    description: "Web client directly querying a publicly exposed PostgreSQL instance over unencrypted TCP connection.",
    nodes: [
      { id: "browser", type: "infrastructure", position: { x: 0, y: 0 }, data: { componentType: "web-browser", label: "Browser SPA", exposure: "public" } },
      { id: "prod_db", type: "infrastructure", position: { x: 300, y: 0 }, data: { componentType: "relational-database", label: "Production PostgreSQL", exposure: "public", publiclyAccessible: true } },
    ],
    edges: [
      { id: "e_direct", source: "browser", target: "prod_db", data: { protocol: "postgres", encryptionInTransit: false } },
    ],
  },
  cross_boundary_sensitive_data: {
    name: "Cross-Boundary Plaintext & Sensitive Data Sprawl",
    description: "Confidential billing service crossing a perimeter trust boundary via unencrypted HTTP and streaming unmasked records to third party and telemetry.",
    nodes: [
      { id: "perimeter_boundary", type: "infrastructure", position: { x: 0, y: 0 }, data: { componentType: "trust-boundary", boundaryName: "Perimeter DMZ", threatModelZone: "perimeter" } },
      { id: "client_web", type: "infrastructure", position: { x: 0, y: 0 }, data: { componentType: "web-browser", label: "Web User", trustLevel: "untrusted-public", boundaryId: "perimeter_boundary" } },
      { id: "billing_svc", type: "infrastructure", position: { x: 220, y: 0 }, data: { componentType: "compute-instance", label: "Billing API", dataSensitivity: "confidential" } },
      { id: "telemetry_logs", type: "infrastructure", position: { x: 440, y: -60 }, data: { componentType: "centralized-log-management", label: "Centralized Logs" } },
      { id: "ext_partner", type: "infrastructure", position: { x: 440, y: 60 }, data: { componentType: "external-dependency", label: "Credit Bureau API" } },
    ],
    edges: [
      { id: "e_plain", source: "client_web", target: "billing_svc", data: { protocol: "http", encryptionInTransit: false } },
      { id: "e_telemetry", source: "billing_svc", target: "telemetry_logs", data: { encryptionInTransit: true, redacted: false } },
      { id: "e_partner", source: "billing_svc", target: "ext_partner", data: { encryptionInTransit: true, tokenized: false } },
    ],
  },
  privileged_admin_unauthorized: {
    name: "Privileged Admin Console & Webhook Intake",
    description: "Administrative console accessible without authorization policy engine, and webhook handler receiving external payloads without signature verification.",
    nodes: [
      { id: "admin_portal", type: "infrastructure", position: { x: 0, y: 0 }, data: { componentType: "compute-instance", label: "Internal Admin Portal", isAdministrative: true } },
      { id: "stripe_webhook", type: "infrastructure", position: { x: 200, y: 0 }, data: { componentType: "compute-instance", label: "Stripe Webhook Receiver", isWebhookHandler: true, verifiesSignature: false } },
      { id: "database", type: "infrastructure", position: { x: 400, y: 0 }, data: { componentType: "relational-database", label: "Core Database", usesSecrets: true } },
    ],
    edges: [
      { id: "e1", source: "admin_portal", target: "database", data: { protocol: "postgres", encryptionInTransit: true } },
      { id: "e2", source: "stripe_webhook", target: "database", data: { protocol: "postgres", encryptionInTransit: true } },
    ],
  },
  zero_trust_hardened: {
    name: "Zero-Trust Hardened Architecture",
    description: "Multi-tier segmentation with WAF, Rate Limiter, authenticated API Gateway, Policy Engine, KMS Vault, and encrypted private persistence.",
    nodes: [
      { id: "client", type: "infrastructure", position: { x: 0, y: 0 }, data: { componentType: "web-browser", label: "Web Client", exposure: "public" } },
      { id: "waf", type: "infrastructure", position: { x: 120, y: 0 }, data: { componentType: "web-application-firewall", label: "Cloudflare WAF", exposure: "public" } },
      { id: "rate_limit", type: "infrastructure", position: { x: 240, y: 0 }, data: { componentType: "rate-limiter", label: "Ingress Rate Limiter" } },
      { id: "api_gw", type: "infrastructure", position: { x: 360, y: 0 }, data: { componentType: "api-gateway", label: "Kong API Gateway", exposure: "public", enforcesTls: true } },
      { id: "auth_svc", type: "infrastructure", position: { x: 360, y: -120 }, data: { componentType: "authentication-service", label: "OIDC Identity Provider" } },
      { id: "authz_policy", type: "infrastructure", position: { x: 480, y: -120 }, data: { componentType: "policy-engine", label: "OPA Policy Engine" } },
      { id: "app_svc", type: "infrastructure", position: { x: 480, y: 0 }, data: { componentType: "compute-instance", label: "Private Core App", enforcesTls: true } },
      { id: "secrets_kms", type: "infrastructure", position: { x: 480, y: 120 }, data: { componentType: "key-management-service", label: "AWS KMS Vault" } },
      { id: "secure_db", type: "infrastructure", position: { x: 620, y: 0 }, data: { componentType: "relational-database", label: "Private PostgreSQL", enforcesTls: true } },
    ],
    edges: [
      { id: "e1", source: "client", target: "waf", data: { protocol: "https", encryptionInTransit: true } },
      { id: "e2", source: "waf", target: "rate_limit", data: { protocol: "https", encryptionInTransit: true } },
      { id: "e3", source: "rate_limit", target: "api_gw", data: { protocol: "https", encryptionInTransit: true } },
      { id: "e4", source: "auth_svc", target: "api_gw", data: { protocol: "grpc/tls", encryptionInTransit: true } },
      { id: "e5", source: "api_gw", target: "app_svc", data: { protocol: "grpc/tls", encryptionInTransit: true } },
      { id: "e6", source: "authz_policy", target: "app_svc", data: { protocol: "grpc/tls", encryptionInTransit: true } },
      { id: "e7", source: "secrets_kms", target: "app_svc", data: { protocol: "grpc/tls", encryptionInTransit: true } },
      { id: "e8", source: "app_svc", target: "secure_db", data: { protocol: "postgres", encryptionInTransit: true } },
    ],
  },
};

export default function ArchitectureSecurityVerificationPage() {
  const [selectedTopologyKey, setSelectedTopologyKey] = React.useState<string>("public_ingress_gaps");
  const activeTopology = PRESET_TOPOLOGIES[selectedTopologyKey] || PRESET_TOPOLOGIES.public_ingress_gaps;

  const [report, setReport] = React.useState<SecurityAnalysisReport>(() =>
    securityAnalysisEngine.analyzeGraph(activeTopology.nodes, activeTopology.edges)
  );

  const [selectedBoundaryId, setSelectedBoundaryId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"findings" | "boundaries" | "json">("findings");

  React.useEffect(() => {
    const updated = securityAnalysisEngine.analyzeGraph(activeTopology.nodes, activeTopology.edges);
    setReport(updated);
  }, [activeTopology]);

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col font-sans selection:bg-surface-03">
      {/* 1. Studio Header */}
      <header className="h-12 border-b border-border-default bg-surface-01 px-4 flex items-center justify-between shrink-0 font-mono text-xs">
        <div className="flex items-center gap-3">
          <Link href="/verify" className="text-text-muted hover:text-foreground transition-colors">
            ← Verification Studio
          </Link>
          <span className="text-border-default">/</span>
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <ShieldIcon className="w-3.5 h-3.5 text-emerald-400" />
            Security Architecture Analysis (Phase 05.3.5)
          </span>
          <Badge variant="outline" className="text-[10px] h-4 font-mono px-1 border-border-subtle text-text-muted">
            Interactive Testbed
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/visualizer/system-design">
            <Button variant="outline" size="sm" className="h-7 text-xs font-mono border-border-default">
              Launch Visualizer Canvas →
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. Topology Selector Toolbar */}
      <div className="border-b border-border-default bg-surface-02 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono text-text-muted shrink-0">Preset Scenario:</label>
          <Select
            value={selectedTopologyKey}
            onValueChange={(val) => {
              if (val) {
                setSelectedTopologyKey(val);
                setSelectedBoundaryId(null);
              }
            }}
          >
            <SelectTrigger className="w-[320px] h-8 text-xs font-mono bg-surface-01 border-border-default">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-01 border-border-strong font-mono text-xs">
              {Object.entries(PRESET_TOPOLOGIES).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Real-time Summary Indicators */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-5 px-1.5 border-border-default font-mono",
              report.summary.criticalCount > 0
                ? "text-rose-400 bg-rose-950/20 border-rose-900/60 font-semibold"
                : "text-emerald-400 bg-emerald-950/20"
            )}
          >
            Critical: {report.summary.criticalCount}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-5 px-1.5 border-border-default font-mono",
              report.summary.highCount > 0
                ? "text-amber-400 bg-amber-950/20 border-amber-900/60"
                : "text-text-muted bg-surface-03"
            )}
          >
            High: {report.summary.highCount}
          </Badge>
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-border-default font-mono text-text-muted">
            Total Items: {report.summary.totalFindings}
          </Badge>
        </div>
      </div>

      {/* 3. Main Workspace Grid */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto">
        {/* Left: Topology Visualizer Preview & Details (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-2">
            <h3 className="text-sm font-semibold text-foreground font-mono">
              {activeTopology.name}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {activeTopology.description}
            </p>
          </div>

          {/* Node & Edge Inventory */}
          <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="font-mono text-xs font-semibold text-text-muted uppercase tracking-wider">
                Graph Topology Elements ({activeTopology.nodes.length} Nodes · {activeTopology.edges.length} Edges)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {activeTopology.nodes.map((n) => {
                const profile = report.nodeProfiles[n.id];
                return (
                  <div
                    key={n.id}
                    className="p-2.5 rounded bg-surface-02 border border-border-subtle font-mono text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary">{n.id}</span>
                      <span className="text-[10px] text-text-muted uppercase">
                        {(n.data?.componentType as string) || n.type}
                      </span>
                    </div>
                    {profile && (
                      <div className="flex items-center gap-2 text-[10px] text-text-disabled">
                        <span>exp: {profile.exposure}</span>
                        <span>•</span>
                        <span>trust: {profile.trustLevel}</span>
                        <span>•</span>
                        <span>data: {profile.dataSensitivity}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Edge Connections List */}
            {activeTopology.edges.length > 0 && (
              <div className="pt-2 border-t border-border-subtle space-y-1">
                <span className="text-[10px] font-mono text-text-muted block uppercase">Connections:</span>
                <div className="space-y-1">
                  {activeTopology.edges.map((e) => (
                    <div
                      key={e.id}
                      className="px-2 py-1 rounded bg-surface-02/60 border border-border-subtle font-mono text-[11px] flex items-center justify-between"
                    >
                      <span>
                        {e.source} → {e.target}
                      </span>
                      <span className="text-[10px] text-text-muted uppercase">
                        {((e.data?.protocol as string) || "tcp")} · {e.data?.encryptionInTransit ? "TLS" : "Plaintext"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Security Analysis Findings & Perimeters (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as "findings" | "boundaries" | "json")}
            className="flex-1 flex flex-col rounded-md bg-surface-01 border border-border-default overflow-hidden"
          >
            <div className="px-3 pt-2 border-b border-border-subtle bg-surface-02 shrink-0">
              <TabsList className="grid grid-cols-3 h-8 bg-surface-01 p-0.5 border border-border-subtle rounded-md">
                <TabsTrigger
                  value="findings"
                  className="text-xs font-mono h-6.5 rounded data-[state=active]:bg-surface-03 data-[state=active]:text-foreground data-[state=active]:shadow-level-1"
                >
                  Findings ({report.findings.length})
                </TabsTrigger>
                <TabsTrigger
                  value="boundaries"
                  className="text-xs font-mono h-6.5 rounded data-[state=active]:bg-surface-03 data-[state=active]:text-foreground data-[state=active]:shadow-level-1"
                >
                  Boundaries ({report.trustBoundaries.length})
                </TabsTrigger>
                <TabsTrigger
                  value="json"
                  className="text-xs font-mono h-6.5 rounded data-[state=active]:bg-surface-03 data-[state=active]:text-foreground data-[state=active]:shadow-level-1"
                >
                  Report JSON
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: FINDINGS */}
            <TabsContent value="findings" className="flex-1 p-3 overflow-y-auto space-y-3 m-0 data-[state=inactive]:hidden">
              {report.findings.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <ShieldIcon className="w-8 h-8 mx-auto text-emerald-400" />
                  <h4 className="text-xs font-semibold text-text-secondary">Security Posture Verified</h4>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Zero security policy conflicts, unmodeled public access, or unencrypted cross-boundary flows identified in this architecture.
                  </p>
                </div>
              ) : (
                report.findings.map((f: SecurityFinding) => (
                  <div
                    key={f.id}
                    className="p-3 rounded bg-surface-02 border border-border-default space-y-2 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-mono h-4 px-1 rounded uppercase",
                          f.severity === "critical"
                            ? "text-rose-400 bg-rose-950/20 border-rose-900/60"
                            : f.severity === "high"
                              ? "text-amber-400 bg-amber-950/20 border-amber-900/60"
                              : "text-text-muted bg-surface-03 border-border-default"
                        )}
                      >
                        {f.severity}
                      </Badge>
                      <span className="font-mono text-[10px] text-text-muted">
                        {f.ruleId} {f.strideCategory ? `· STRIDE: ${f.strideCategory}` : ""}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-text-primary leading-snug">
                      {f.title}
                    </h4>

                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      {f.explanation}
                    </p>

                    {/* Remediation Suggestions */}
                    {f.recommendationIds.length > 0 && (
                      <div className="pt-1 border-t border-border-subtle">
                        {f.recommendationIds.map((recId) => {
                          const rec = SECURITY_RECOMMENDATIONS_CATALOG[recId];
                          if (!rec) return null;
                          return (
                            <div key={recId} className="space-y-1">
                              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                                <LockIcon className="w-2.5 h-2.5" />
                                {rec.title}
                              </span>
                              <p className="text-[10px] text-text-muted leading-relaxed">
                                {rec.actionableStep}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            {/* TAB 2: TRUST BOUNDARIES */}
            <TabsContent value="boundaries" className="flex-1 p-3 overflow-y-auto m-0 data-[state=inactive]:hidden">
              <TrustBoundaryExplorer
                report={report}
                selectedBoundaryId={selectedBoundaryId}
                onSelectBoundary={setSelectedBoundaryId}
                onSelectNode={() => {}}
                onSelectEdge={() => {}}
              />
            </TabsContent>

            {/* TAB 3: REPORT JSON */}
            <TabsContent value="json" className="flex-1 p-3 overflow-y-auto m-0 data-[state=inactive]:hidden">
              <pre className="p-3 rounded bg-surface-02 border border-border-default text-[10px] font-mono text-text-secondary overflow-x-auto">
                {JSON.stringify(report, null, 2)}
              </pre>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
