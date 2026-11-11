"use client";

/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Master Studio Network Workspace Shell
 */

import React, { useState } from "react";
import {
  useArchitectureNetwork,
  type UseArchitectureNetworkProps,
  type NetworkTab,
} from "../hooks/use-architecture-network";
import { NetworkExplorer } from "./network-explorer";
import { DnsExplorer } from "./dns-explorer";
import { GatewayRouteInspector } from "./gateway-route-inspector";
import { LoadBalancerInspector } from "./load-balancer-inspector";
import { TrafficPathExplorer } from "./traffic-path-explorer";
import { NetworkPolicyInspector } from "./network-policy-inspector";
import { RegionalTrafficView } from "./regional-traffic-view";
import { NetworkFindingsView } from "./network-findings-view";
import {
  LayersIcon,
  ShieldIcon,
  CpuIcon,
  ActivityIcon,
  SlidersIcon,
  AlertTriangleIcon,
  TerminalIcon,
  RefreshIcon,
} from "@nxtqr/icons";

export interface NetworkWorkspaceProps extends UseArchitectureNetworkProps {}

export function NetworkWorkspace(props: NetworkWorkspaceProps) {
  const {
    topology,
    activeTab,
    setActiveTab,
    selectedGatewayId,
    setSelectedGatewayId,
    selectedGateway,
    selectedRouteId,
    setSelectedRouteId,
    selectedRoute,
    selectedPoolId,
    setSelectedPoolId,
    selectedPool,
    selectedDnsZoneId,
    setSelectedDnsZoneId,
    selectedDnsZone,
    selectedPathId,
    setSelectedPathId,
    selectedPath,
    analysisResult,
    updateGateway: _updateGateway,
    updateRoute,
    updateUpstreamPool,
    updateDNSZone,
    importKubernetesManifest,
    resetTopology,
  } = useArchitectureNetwork(props);

  const [manifestModalOpen, setManifestModalOpen] = useState(false);
  const [manifestText, setManifestText] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const summary = analysisResult.summary;

  const handleImport = () => {
    if (!manifestText.trim()) return;
    const res = importKubernetesManifest(manifestText);
    if (res.success) {
      setImportStatus("Successfully parsed Kubernetes Gateway API manifests.");
      setTimeout(() => {
        setManifestModalOpen(false);
        setManifestText("");
        setImportStatus(null);
      }, 1200);
    } else {
      setImportStatus(`Import Error: ${res.errors.join(", ")}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#000000] text-[#FFFFFF]">
      {/* Top Header / KPI Bar */}
      <header className="h-14 border-b border-[#262626] bg-[#080808] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-[#FFFFFF]" />
            <span className="font-bold text-xs tracking-wider uppercase text-[#FFFFFF]">
              Network & Traffic Intelligence
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#858585] border-l border-[#262626] pl-3">
            v{topology.version} ({topology.graphRevision})
          </span>
        </div>

        {/* Global KPI Summary */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#B5B5B5]">
            <span className="text-[#858585]">Gateways:</span>
            <span className="text-[#FFFFFF] font-bold">{summary.gatewayCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#B5B5B5]">
            <span className="text-[#858585]">Routes:</span>
            <span className="text-[#FFFFFF] font-bold">{summary.routeCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#B5B5B5]">
            <span className="text-[#858585]">Pools:</span>
            <span className="text-[#FFFFFF] font-bold">{summary.poolCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#B5B5B5]">
            <span className="text-[#858585]">Plaintext:</span>
            <span
              className={
                summary.hasPlaintextExposure ? "text-[#FF4D4D] font-bold" : "text-[#4ADE80]"
              }
            >
              {summary.hasPlaintextExposure ? "Hazard" : "Clean"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[#B5B5B5]">
            <span className="text-[#858585]">Findings:</span>
            <span
              className={`font-bold ${
                summary.criticalFindingsCount > 0
                  ? "text-[#FF4D4D]"
                  : summary.highFindingsCount > 0
                  ? "text-[#FFAA00]"
                  : "text-[#4ADE80]"
              }`}
            >
              {analysisResult.findings.length}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setManifestModalOpen(true)}
            className="px-2.5 py-1.5 rounded-md bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-xs font-mono text-[#FFFFFF] flex items-center gap-1.5 transition-colors"
          >
            <TerminalIcon className="w-3.5 h-3.5 text-[#858585]" />
            <span>Import K8s Manifest</span>
          </button>
          <button
            onClick={resetTopology}
            title="Reset default topology"
            className="p-1.5 rounded-md bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-[#858585] hover:text-[#FFFFFF] transition-colors"
          >
            <RefreshIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Navigation Sub-Header Tabs */}
      <nav className="h-10 border-b border-[#262626] bg-[#0A0A0A] px-4 flex items-center gap-1 shrink-0 overflow-x-auto">
        {(
          [
            { id: "overview", label: "Overview", icon: LayersIcon },
            { id: "dns", label: "DNS Resolution", icon: ShieldIcon },
            { id: "gateways", label: "Gateways & Routes", icon: LayersIcon },
            { id: "load_balancers", label: "Load Balancers", icon: CpuIcon },
            { id: "paths", label: "Traffic Paths", icon: ActivityIcon },
            { id: "policies", label: "Traffic Policies", icon: SlidersIcon },
            { id: "regional", label: "Regional Traffic", icon: ActivityIcon },
            {
              id: "findings",
              label: `Findings (${analysisResult.findings.length})`,
              icon: AlertTriangleIcon,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as NetworkTab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 border whitespace-nowrap ${
                isActive
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border-[#333333]"
                  : "text-[#858585] hover:text-[#FFFFFF] border-transparent hover:bg-[#0D0D0D]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Workspace Body: Left Catalog + Center Active Tab */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Catalog Sidebar */}
        <NetworkExplorer
          dnsZones={topology.dnsZones}
          gateways={topology.gateways}
          loadBalancers={topology.loadBalancers}
          upstreamPools={topology.upstreamPools}
          scenarios={topology.scenarios}
          selectedDnsZoneId={selectedDnsZoneId}
          selectedGatewayId={selectedGatewayId}
          selectedRouteId={selectedRouteId}
          selectedPoolId={selectedPoolId}
          selectedScenarioId={selectedPathId.replace("path-", "")}
          onSelectDnsZone={(id) => {
            setSelectedDnsZoneId(id);
            setActiveTab("dns");
          }}
          onSelectGateway={(id) => {
            setSelectedGatewayId(id);
            setActiveTab("gateways");
          }}
          onSelectRoute={(gwId, routeId) => {
            setSelectedGatewayId(gwId);
            setSelectedRouteId(routeId);
            setActiveTab("gateways");
          }}
          onSelectPool={(id) => {
            setSelectedPoolId(id);
            setActiveTab("load_balancers");
          }}
          onSelectScenario={(scId) => {
            setSelectedPathId(`path-${scId}`);
            setActiveTab("paths");
          }}
        />

        {/* Center Main Stage */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#000000]">
          <div className="max-w-6xl mx-auto space-y-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-[#FFFFFF]">
                    Network & Traffic Architecture Topology
                  </h2>
                  <p className="text-xs text-[#858585] mt-1">
                    Deterministic static model connecting DNS, edge CDNs, API gateways, Layer 7 load balancers, and upstream pools.
                  </p>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-1">
                    <span className="text-xs text-[#858585] font-mono">DNS Records</span>
                    <div className="text-2xl font-bold font-mono text-[#FFFFFF]">
                      {summary.dnsRecordCount}
                    </div>
                  </div>
                  <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-1">
                    <span className="text-xs text-[#858585] font-mono">Ingress Gateways</span>
                    <div className="text-2xl font-bold font-mono text-[#FFFFFF]">
                      {summary.gatewayCount}
                    </div>
                  </div>
                  <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-1">
                    <span className="text-xs text-[#858585] font-mono">Upstream Pools</span>
                    <div className="text-2xl font-bold font-mono text-[#FFFFFF]">
                      {summary.poolCount}
                    </div>
                  </div>
                  <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-1">
                    <span className="text-xs text-[#858585] font-mono">Safety Violations</span>
                    <div
                      className={`text-2xl font-bold font-mono ${
                        summary.criticalFindingsCount > 0 ? "text-[#FF4D4D]" : "text-[#4ADE80]"
                      }`}
                    >
                      {analysisResult.findings.length}
                    </div>
                  </div>
                </div>

                {/* Subsystems Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gateways & Routes Quick List */}
                  <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#FFFFFF]">
                        Ingress Gateways ({topology.gateways.length})
                      </span>
                      <button
                        onClick={() => setActiveTab("gateways")}
                        className="text-xs text-[#858585] hover:text-[#FFFFFF]"
                      >
                        Inspect →
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {topology.gateways.map((gw) => (
                        <div
                          key={gw.id}
                          className="p-2.5 bg-[#0D0D0D] border border-[#202020] rounded-md flex items-center justify-between text-xs"
                        >
                          <span className="font-mono text-[#FFFFFF]">{gw.name}</span>
                          <span className="text-[#858585] font-mono">
                            {gw.routes.length} routes ({gw.providerTechnology})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upstream Pools Quick List */}
                  <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#FFFFFF]">
                        Backend Upstream Pools ({topology.upstreamPools.length})
                      </span>
                      <button
                        onClick={() => setActiveTab("load_balancers")}
                        className="text-xs text-[#858585] hover:text-[#FFFFFF]"
                      >
                        Inspect →
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {topology.upstreamPools.map((pool) => (
                        <div
                          key={pool.id}
                          className="p-2.5 bg-[#0D0D0D] border border-[#202020] rounded-md flex items-center justify-between text-xs"
                        >
                          <span className="font-mono text-[#FFFFFF]">{pool.name}</span>
                          <span className="text-[#858585] font-mono">
                            {pool.endpoints.filter((e) => e.isHealthy).length} / {pool.endpoints.length} healthy
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "dns" && (
              <DnsExplorer
                dnsZones={topology.dnsZones}
                selectedZone={selectedDnsZone}
                findings={analysisResult.findings}
                onSelectZone={setSelectedDnsZoneId}
                onUpdateZone={updateDNSZone}
              />
            )}

            {activeTab === "gateways" && (
              <GatewayRouteInspector
                gateway={selectedGateway}
                selectedRoute={selectedRoute}
                upstreamPools={topology.upstreamPools}
                findings={analysisResult.findings}
                onSelectRoute={setSelectedRouteId}
                onUpdateRoute={(route) => {
                  if (selectedGateway) {
                    updateRoute(selectedGateway.id, route);
                  }
                }}
              />
            )}

            {activeTab === "load_balancers" && (
              <LoadBalancerInspector
                loadBalancers={topology.loadBalancers}
                upstreamPools={topology.upstreamPools}
                selectedPool={selectedPool}
                findings={analysisResult.findings}
                onSelectPool={setSelectedPoolId}
                onUpdatePool={updateUpstreamPool}
              />
            )}

            {activeTab === "paths" && (
              <TrafficPathExplorer
                paths={analysisResult.resolvedPaths}
                scenarios={topology.scenarios}
                selectedPath={selectedPath}
                findings={analysisResult.findings}
                onSelectPath={setSelectedPathId}
              />
            )}

            {activeTab === "policies" && (
              <NetworkPolicyInspector
                gateways={topology.gateways}
                selectedGateway={selectedGateway}
                findings={analysisResult.findings}
              />
            )}

            {activeTab === "regional" && (
              <RegionalTrafficView
                topology={topology}
                findings={analysisResult.findings}
              />
            )}

            {activeTab === "findings" && (
              <NetworkFindingsView findings={analysisResult.findings} />
            )}
          </div>
        </main>
      </div>

      {/* Manifest Import Modal */}
      {manifestModalOpen && (
        <div className="fixed inset-0 bg-[#000000]/80 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-[#080808] border border-[#262626] rounded-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#202020]">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-[#858585]" />
                <h3 className="text-sm font-semibold text-[#FFFFFF]">
                  Import Kubernetes Gateway API / Ingress Manifest
                </h3>
              </div>
              <button
                onClick={() => setManifestModalOpen(false)}
                className="text-xs text-[#858585] hover:text-[#FFFFFF]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#858585]">
              Paste bounded Gateway API (<code>Gateway</code>, <code>HTTPRoute</code>) or <code>Ingress</code> YAML manifests. The engine parses route rules, backend refs, and listeners safely without execution.
            </p>

            <textarea
              rows={10}
              value={manifestText}
              onChange={(e) => setManifestText(e.target.value)}
              placeholder={`apiVersion: gateway.networking.k8s.io/v1\nkind: Gateway\nmetadata:\n  name: prod-gateway\nspec:\n  gatewayClassName: istio\n  listeners:\n  - name: https\n    protocol: HTTPS\n    port: 443\n---`}
              className="w-full bg-[#0D0D0D] border border-[#262626] rounded-md p-3 font-mono text-xs text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#404040]"
            />

            {importStatus && (
              <div
                className={`p-2.5 rounded-md text-xs font-mono border ${
                  importStatus.startsWith("Successfully")
                    ? "bg-[#0D1A10] border-[#165525] text-[#4ADE80]"
                    : "bg-[#1A0A0A] border-[#551A1A] text-[#FF4D4D]"
                }`}
              >
                {importStatus}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#202020]">
              <button
                onClick={() => setManifestModalOpen(false)}
                className="px-3 py-1.5 rounded-md bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-xs font-mono text-[#858585] hover:text-[#FFFFFF]"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!manifestText.trim()}
                className="px-3 py-1.5 rounded-md bg-[#1A1A1A] hover:bg-[#202020] border border-[#404040] text-xs font-mono text-[#FFFFFF] font-medium disabled:opacity-50"
              >
                Parse & Import Routes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
