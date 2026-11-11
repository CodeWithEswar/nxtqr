"use client";

/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Evidence Artifacts Registry & Freshness Explorer
 */

import React, { useState } from "react";
import type { EvidenceArtifact } from "@nxtqr/architecture-intelligence";
import {
  ShieldIcon,
  TerminalIcon,
  SearchIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "@nxtqr/icons";

export interface EvidenceExplorerProps {
  evidence: EvidenceArtifact[];
  onAddEvidence?: (artifact: EvidenceArtifact) => void;
}

export function EvidenceExplorer({
  evidence,
  onAddEvidence: _onAddEvidence,
}: EvidenceExplorerProps) {
  const [search, setSearch] = useState("");
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    evidence[0]?.id || null
  );

  const nowMs = Date.now();

  const filtered = evidence.filter((ev) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      ev.id.toLowerCase().includes(q) ||
      ev.evidenceType.toLowerCase().includes(q) ||
      ev.sourceIdentifier.toLowerCase().includes(q) ||
      ev.owner.toLowerCase().includes(q)
    );
  });

  const selectedArtifact = evidence.find((e) => e.id === selectedArtifactId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-full divide-x divide-[#262626] bg-[#000000] text-white">
      {/* Evidence List */}
      <div className="flex flex-col h-full bg-[#080808]">
        <div className="p-3 border-b border-[#262626] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldIcon size={16} className="text-white" />
              <span className="text-xs font-semibold tracking-wider uppercase text-[#B5B5B5]">
                Evidence Proof Registry
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#858585]">
              {evidence.length} Artifacts
            </span>
          </div>

          <div className="relative">
            <SearchIcon
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#858585]"
            />
            <input
              type="text"
              placeholder="Search evidence by id or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#262626] text-xs text-white pl-8 pr-2.5 py-1.5 rounded-md focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#1A1A1A]">
          {filtered.map((ev) => {
            const observedMs = new Date(ev.observedAt).getTime();
            const ageSeconds = (nowMs - observedMs) / 1000;
            const isStale = ageSeconds > ev.freshnessWindowSeconds;
            const isSelected = ev.id === selectedArtifactId;

            return (
              <div
                key={ev.id}
                onClick={() => setSelectedArtifactId(ev.id)}
                className={`p-3 cursor-pointer transition-colors ${
                  isSelected ? "bg-[#1A1A1A] border-l-2 border-[#404040]" : "hover:bg-[#0D0D0D]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-medium text-white truncate">
                    {ev.id}
                  </span>
                  {isStale ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-[#ef4444] bg-[#0D0D0D] border border-[#262626] px-1.5 py-0.5 rounded-md">
                      <AlertCircleIcon size={12} /> EXPIRED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-[#22c55e] bg-[#0D0D0D] border border-[#262626] px-1.5 py-0.5 rounded-md">
                      <CheckCircleIcon size={12} /> FRESH
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-mono text-[#B5B5B5] mb-1">
                  {ev.evidenceType}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#858585]">
                  <span>{ev.owner}</span>
                  <span>{ev.freshnessWindowSeconds / 3600}h window</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Artifact Details & JSON Payload */}
      <div className="md:col-span-2 flex flex-col h-full bg-[#000000] p-4 overflow-y-auto space-y-4">
        {selectedArtifact ? (
          <>
            <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    {selectedArtifact.id}
                  </h3>
                  <p className="text-xs text-[#858585]">
                    Source: {selectedArtifact.sourceIdentifier}
                  </p>
                </div>
                <span className="text-xs font-mono text-[#B5B5B5] bg-[#141414] border border-[#202020] px-2 py-1 rounded-md">
                  {selectedArtifact.evidenceType}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-[#1A1A1A] text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[#666666] block">OBSERVED</span>
                  <span className="text-[#B5B5B5]">
                    {selectedArtifact.observedAt.split("T")[0]}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#666666] block">FRESHNESS</span>
                  <span className="text-[#B5B5B5]">
                    {selectedArtifact.freshnessWindowSeconds / 3600} hours
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#666666] block">OWNER</span>
                  <span className="text-[#B5B5B5]">{selectedArtifact.owner}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#666666] block">PROVENANCE</span>
                  <span className="text-[#B5B5B5]">
                    {selectedArtifact.provenance.source}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1A1A1A]">
                <span className="text-[10px] font-mono text-[#666666] block mb-1">
                  SHA-256 INTEGRITY FINGERPRINT
                </span>
                <span className="text-xs font-mono text-white bg-[#0D0D0D] border border-[#202020] px-2 py-1 rounded-md block select-all">
                  {selectedArtifact.integrityHash}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#B5B5B5] flex items-center gap-2">
                <TerminalIcon size={14} /> Artifact Content Payload
              </span>
              <pre className="p-3 bg-[#080808] border border-[#262626] rounded-md text-xs font-mono text-white overflow-x-auto">
                {JSON.stringify(selectedArtifact.content, null, 2)}
              </pre>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-[#858585]">
            Select an evidence artifact to inspect cryptographic fingerprint and payload.
          </div>
        )}
      </div>
    </div>
  );
}
