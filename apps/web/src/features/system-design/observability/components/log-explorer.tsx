"use client";

import React, { useState, useMemo } from "react";
import type { StructuredLogEntry } from "@nxtqr/architecture-intelligence";
import { TerminalIcon, SearchIcon, AlertTriangleIcon, HelpCircleIcon, AlertCircleIcon } from "@nxtqr/icons";

export interface LogExplorerProps {
  entries: StructuredLogEntry[];
  className?: string;
}

export function LogExplorer({ entries, className = "" }: LogExplorerProps) {
  const [filterSeverity, setFilterSeverity] = useState<"all" | "info" | "warn" | "error">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filterSeverity !== "all" && entry.severity !== filterSeverity) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesMsg = entry.message.toLowerCase().includes(query);
        const matchesService = entry.serviceName.toLowerCase().includes(query);
        if (!matchesMsg && !matchesService) return false;
      }
      return true;
    });
  }, [entries, filterSeverity, searchQuery]);

  const getSeverityPill = (severity: StructuredLogEntry["severity"]) => {
    switch (severity) {
      case "error":
      case "fatal":
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] uppercase bg-red-950/40 border border-red-900/40 text-red-400">
            <AlertCircleIcon className="w-3 h-3" />
            {severity}
          </span>
        );
      case "warn":
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] uppercase bg-amber-950/40 border border-amber-900/40 text-amber-400">
            <AlertTriangleIcon className="w-3 h-3" />
            {severity}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] uppercase bg-[#141414] border border-[#262626] text-[#858585]">
            <HelpCircleIcon className="w-3 h-3" />
            {severity}
          </span>
        );
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#080808] border border-[#262626] rounded-md text-white text-xs select-none overflow-hidden ${className}`}>
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 border-b border-[#262626] bg-[#0D0D0D]">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-white" />
          <span className="font-semibold text-sm">Correlated Log Stream</span>
          <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-[#141414] border border-[#262626] text-[#858585]">
            {filteredEntries.length} entries
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#141414] border border-[#262626] rounded-md text-xs">
            <SearchIcon className="w-3.5 h-3.5 text-[#858585]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter logs or services..."
              className="bg-transparent border-none text-white text-xs font-mono outline-none placeholder:text-[#666666] w-36"
            />
          </div>

          {/* Severity selector */}
          <div className="flex items-center gap-0.5 bg-[#141414] p-0.5 border border-[#262626] rounded-md font-mono text-[10px]">
            {(["all", "info", "warn", "error"] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setFilterSeverity(sev)}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  filterSeverity === sev
                    ? "bg-[#262626] text-white font-semibold"
                    : "text-[#858585] hover:text-white"
                }`}
              >
                {sev.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Log Stream Table */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1A1A1A] font-mono text-[11px]">
        {filteredEntries.map((log) => {
          const isExpanded = expandedLogId === log.id;
          const timeStr = new Date(log.timestampMs).toLocaleTimeString();

          return (
            <div
              key={log.id}
              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
              className="p-2 hover:bg-[#0D0D0D] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[#666666] flex-shrink-0">{timeStr}</span>
                {getSeverityPill(log.severity)}
                <span className="px-1.5 py-0.5 bg-[#141414] border border-[#262626] rounded text-white flex-shrink-0">
                  {log.serviceName}
                </span>
                <span className="text-[#B5B5B5] truncate flex-1">{log.message}</span>
              </div>

              {/* Expanded JSON details */}
              {isExpanded && log.attributes && (
                <div className="mt-2 p-2 bg-[#090909] border border-[#262626] rounded-md text-[10px] text-[#858585] space-y-1">
                  <div className="font-bold text-white mb-1">Log Record Metadata:</div>
                  <pre className="whitespace-pre-wrap overflow-x-auto text-emerald-400 font-mono">
                    {JSON.stringify(log.attributes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}

        {filteredEntries.length === 0 && (
          <div className="p-8 text-center text-[#858585] text-xs font-mono">
            No correlated log entries found matching active filters.
          </div>
        )}
      </div>
    </div>
  );
}
