"use client";

import * as React from "react";
import type { BenchmarkDefinition } from "@nxtqr/architecture-intelligence";
import { CopyIcon, ArchiveIcon, CheckIcon, ShieldIcon } from "@nxtqr/icons";

export interface K6ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scriptContent: string;
  definition: BenchmarkDefinition;
}

export function K6ExportModal({
  isOpen,
  onClose,
  scriptContent,
  definition,
}: K6ExportModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scriptContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([scriptContent], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${definition.name.toLowerCase().replace(/\s+/g, "-")}-test.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-none select-none p-4">
      <div className="w-full max-w-3xl bg-[#080808] border border-[#262626] rounded-md shadow-level-2 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 bg-[#0D0D0D] border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Export k6 Test Script
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#141414] border border-[#262626] font-mono text-[10px] text-white">
              {definition.testType.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-xs font-mono text-white transition-colors"
            >
              {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Script"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#262626] hover:bg-[#333333] border border-[#404040] text-xs font-mono text-white transition-colors"
            >
              <ArchiveIcon className="w-3.5 h-3.5" />
              Download .js
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 rounded-md text-xs font-mono text-[#858585] hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Safety Verification Strip */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#141414] border-b border-[#202020] text-xs font-mono text-[#858585]">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldIcon className="w-3.5 h-3.5" />
            <span>Target Host Allowed: {definition.targetHost}</span>
          </div>
          <span>Model: {definition.workloadProfile.modelType.toUpperCase()}</span>
        </div>

        {/* Script Viewer */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#050505] font-mono text-[11px] text-[#B5B5B5] leading-relaxed custom-scrollbar whitespace-pre">
          {scriptContent}
        </div>

        {/* Execution hint */}
        <div className="p-3 bg-[#0D0D0D] border-t border-[#262626] flex items-center justify-between text-xs font-mono text-[#858585]">
          <span>Run locally: <code>k6 run --summary-export=summary.json test.js</code></span>
          <span className="text-[#666666]">Import summary.json into NXTQR to visualize results</span>
        </div>
      </div>
    </div>
  );
}
