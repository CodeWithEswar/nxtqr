"use client";

/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Governance Policy & Bundle Explorer Sidebar
 */

import React from "react";
import type {
  PolicyBundle,
  GovernancePolicy,
  PolicyEvaluation,
} from "@nxtqr/architecture-intelligence";
import {
  ShieldIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  HelpCircleIcon,
  SearchIcon,
  LockIcon,
  DatabaseIcon,
  CpuIcon,
  ActivityIcon,
} from "@nxtqr/icons";

export interface GovernanceExplorerProps {
  bundles: PolicyBundle[];
  policies: GovernancePolicy[];
  evaluations: PolicyEvaluation[];
  selectedPolicyId: string;
  onSelectPolicy: (id: string) => void;
  selectedBundleId: string;
  onSelectBundle: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  severityFilter: string;
  onSeverityFilterChange: (severity: string) => void;
}

export function GovernanceExplorer({
  bundles,
  policies,
  evaluations,
  selectedPolicyId,
  onSelectPolicy,
  selectedBundleId,
  onSelectBundle,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  severityFilter,
  onSeverityFilterChange,
}: GovernanceExplorerProps) {
  // Category icon helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "security":
        return <LockIcon size={14} className="text-[#B5B5B5]" />;
      case "reliability":
        return <CpuIcon size={14} className="text-[#B5B5B5]" />;
      case "data_protection":
        return <DatabaseIcon size={14} className="text-[#B5B5B5]" />;
      case "network":
        return <ActivityIcon size={14} className="text-[#B5B5B5]" />;
      default:
        return <CpuIcon size={14} className="text-[#B5B5B5]" />;
    }
  };

  // Helper to determine evaluation status for a policy across resources
  const getPolicyStatus = (policyId: string) => {
    const policyEvals = evaluations.filter((e) => e.policyId === policyId);
    if (policyEvals.length === 0) return "not_applicable";
    if (policyEvals.some((e) => e.status === "fail")) return "fail";
    if (policyEvals.some((e) => e.status === "unknown")) return "unknown";
    if (policyEvals.every((e) => e.status === "pass")) return "pass";
    return "not_applicable";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pass":
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono text-[#22c55e] bg-[#080808] border border-[#262626] px-1.5 py-0.5 rounded-md">
            <CheckCircleIcon size={12} /> PASS
          </span>
        );
      case "fail":
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono text-[#ef4444] bg-[#080808] border border-[#262626] px-1.5 py-0.5 rounded-md">
            <AlertCircleIcon size={12} /> FAIL
          </span>
        );
      case "unknown":
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono text-[#eab308] bg-[#080808] border border-[#262626] px-1.5 py-0.5 rounded-md">
            <HelpCircleIcon size={12} /> NO PROOF
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-mono text-[#858585] bg-[#080808] border border-[#262626] px-1.5 py-0.5 rounded-md">
            N/A
          </span>
        );
    }
  };

  // Active bundle policies filter
  const currentBundle = bundles.find((b) => b.id === selectedBundleId);
  const bundlePolicyIds = currentBundle ? currentBundle.policyIds : [];

  const visiblePolicies = policies.filter((p) => {
    // Check bundle membership if bundle selected
    if (selectedBundleId && selectedBundleId !== "all" && !bundlePolicyIds.includes(p.id)) {
      return false;
    }
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchId = p.id.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchDesc) return false;
    }
    // Severity filter
    if (severityFilter !== "all" && p.severity !== severityFilter) return false;
    // Status filter
    if (statusFilter !== "all") {
      const st = getPolicyStatus(p.id);
      if (st !== statusFilter) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#080808] border-r border-[#262626] text-white select-none">
      {/* Header & Bundle Selector */}
      <div className="p-3 border-b border-[#262626] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldIcon size={16} className="text-white" />
            <span className="text-xs font-semibold tracking-wider uppercase text-[#B5B5B5]">
              Policy Registry
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#858585]">
            {visiblePolicies.length} / {policies.length}
          </span>
        </div>

        {/* Standard Bundles Carousel / Selector */}
        <div>
          <label className="text-[10px] uppercase font-mono tracking-wider text-[#666666] mb-1.5 block">
            Policy Bundle
          </label>
          <select
            value={selectedBundleId}
            onChange={(e) => onSelectBundle(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-[#262626] hover:border-[#333333] focus:border-[#404040] focus:outline-none text-xs text-white p-2 rounded-md transition-colors"
          >
            <option value="all">All Enterprise Policies ({policies.length})</option>
            {bundles.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.policyIds.length})
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative">
          <SearchIcon
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#858585]"
          />
          <input
            type="text"
            placeholder="Search policies or controls..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-[#262626] hover:border-[#333333] focus:border-[#404040] focus:outline-none text-xs text-white pl-8 pr-2.5 py-1.5 rounded-md transition-colors placeholder-[#666666]"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#262626] text-[11px] text-[#B5B5B5] p-1.5 rounded-md focus:outline-none"
            >
              <option value="all">All States</option>
              <option value="pass">Passing</option>
              <option value="fail">Failing</option>
              <option value="unknown">Unknown</option>
              <option value="not_applicable">N/A</option>
            </select>
          </div>
          <div>
            <select
              value={severityFilter}
              onChange={(e) => onSeverityFilterChange(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#262626] text-[11px] text-[#B5B5B5] p-1.5 rounded-md focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Policies List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1A1A1A]">
        {visiblePolicies.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#858585]">
            No policies match the active filter criteria.
          </div>
        ) : (
          visiblePolicies.map((p) => {
            const isSelected = p.id === selectedPolicyId;
            const status = getPolicyStatus(p.id);

            return (
              <div
                key={p.id}
                onClick={() => onSelectPolicy(p.id)}
                className={`p-3 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[#1A1A1A] border-l-2 border-[#404040]"
                    : "hover:bg-[#0D0D0D]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getCategoryIcon(p.category)}
                    <span className="text-[11px] font-mono font-medium text-[#B5B5B5] truncate">
                      {p.id}
                    </span>
                  </div>
                  {getStatusBadge(status)}
                </div>

                <div className="text-xs font-medium text-white mb-1 line-clamp-1">
                  {p.title}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-[#858585] font-mono">
                  <span className="uppercase">{p.severity}</span>
                  <span>•</span>
                  <span>v{p.version}</span>
                  {p.requiredEvidenceTypes.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{p.requiredEvidenceTypes.length} proof required</span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
