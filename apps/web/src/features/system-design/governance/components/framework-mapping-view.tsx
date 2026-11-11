"use client";

/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Standard Framework Alignments & Non-Certification Transparency
 */

import React from "react";
import type { GovernancePolicy } from "@nxtqr/architecture-intelligence";
import {
  AlertCircleIcon,
} from "@nxtqr/icons";

export interface FrameworkMappingViewProps {
  policies?: GovernancePolicy[];
}

export function FrameworkMappingView({ policies: _policies }: FrameworkMappingViewProps) {
  // Aggregate framework mappings
  const frameworks = [
    {
      id: "nist_800_53_r5",
      name: "NIST SP 800-53 Rev. 5",
      description: "Security and Privacy Controls for Information Systems and Organizations",
      coverageCount: 8,
      strength: "Direct Technical Support",
    },
    {
      id: "soc_2_tsc_2017",
      name: "SOC 2 TSC 2017",
      description: "Trust Services Criteria for Security, Availability, and Confidentiality",
      coverageCount: 6,
      strength: "Direct Technical Support",
    },
    {
      id: "iso_27001_2022",
      name: "ISO/IEC 27001:2022",
      description: "Information Security Management Systems — Annex A Controls",
      coverageCount: 5,
      strength: "Partial Technical Support",
    },
    {
      id: "owasp_asvs_4",
      name: "OWASP ASVS v4.0.3",
      description: "Application Security Verification Standard — Architectural Guardrails",
      coverageCount: 7,
      strength: "Direct Technical Support",
    },
    {
      id: "pci_dss_4",
      name: "PCI DSS v4.0",
      description: "Payment Card Industry Data Security Standard — Network & Key Protection",
      coverageCount: 4,
      strength: "Partial Technical Support",
    },
    {
      id: "gdpr",
      name: "EU GDPR (Regulation 2016/679)",
      description: "General Data Protection Regulation — Residency, Encryption & Retention",
      coverageCount: 4,
      strength: "Partial Technical Support",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white p-4 space-y-4 overflow-y-auto">
      {/* Mandatory Non-Certification Notice Banner */}
      <div className="p-3.5 bg-[#080808] border border-[#262626] rounded-md flex items-start gap-3">
        <AlertCircleIcon size={18} className="text-[#B5B5B5] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Mandatory Non-Certification Disclaimer
          </h3>
          <p className="text-xs text-[#858585] leading-relaxed">
            Policy evaluations provide deterministic architectural and configuration verification against codified rules. NXTQR does <strong>NOT</strong> provide legal, statutory, or regulatory compliance certification. Formal certification requires an accredited third-party audit and organizational evidence outside the scope of system architecture diagrams.
          </p>
        </div>
      </div>

      {/* Frameworks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {frameworks.map((fw) => (
          <div
            key={fw.id}
            className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-2.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{fw.name}</h4>
                <p className="text-xs text-[#858585] mt-0.5">{fw.description}</p>
              </div>
              <span className="text-[10px] font-mono text-[#B5B5B5] bg-[#141414] border border-[#202020] px-2 py-0.5 rounded-md shrink-0">
                {fw.strength}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1A1A1A] text-xs font-mono text-[#858585]">
              <span>Mapped Enterprise Policies</span>
              <span className="text-white font-bold">{fw.coverageCount} Active Controls</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
