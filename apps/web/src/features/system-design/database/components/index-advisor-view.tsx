"use client";

/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Index Advisor & Redundancy Inspector
 */

import React from "react";
import type {
  DatabaseTable,
  DatabaseArchitectureFinding,
} from "@nxtqr/architecture-intelligence";
import { LayersIcon, AlertTriangleIcon, CheckIcon } from "@nxtqr/icons";

export interface IndexAdvisorViewProps {
  table: DatabaseTable | null;
  findings: DatabaseArchitectureFinding[];
}

export function IndexAdvisorView({ table, findings }: IndexAdvisorViewProps) {
  if (!table) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[#858585]">
        <LayersIcon className="w-8 h-8 mb-2 text-[#666666]" />
        <p className="text-sm">Select a table to review index coverage and redundancy.</p>
      </div>
    );
  }

  const tableIndexFindings = findings.filter(
    (f) =>
      (f.affectedTableId === table.id || f.title.includes(table.name)) &&
      (f.category === "redundant_index" ||
        f.category === "missing_foreign_key_index" ||
        f.category === "write_amplification_overhead")
  );

  const redundantCount = tableIndexFindings.filter((f) => f.category === "redundant_index").length;
  const isHighWriteAmplification = table.indexes.length > 5;

  return (
    <div className="flex flex-col h-full bg-[#000000] overflow-y-auto p-6 space-y-6">
      {/* Header & Write Amplification Gauge */}
      <div className="p-4 bg-[#080808] border border-[#262626] rounded-md flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-[#FFFFFF]" />
            Index Coverage & Optimization Advisor: {table.name}
          </h2>
          <p className="text-xs text-[#858585] mt-1">
            Analyzing index selectivity, left-prefix duplication, and write overhead across {table.indexes.length} indexes.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-[#666666] block">
              Redundant Indexes
            </span>
            <span className={`text-sm font-bold font-mono ${redundantCount > 0 ? "text-[#FFFFFF]" : "text-[#858585]"}`}>
              {redundantCount}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-[#666666] block">
              Write Amplification
            </span>
            <span className="text-sm font-bold font-mono text-[#FFFFFF]">
              {table.indexes.length}x B-Tree updates
            </span>
          </div>
        </div>
      </div>

      {/* Write Overhead Warning Banner if > 5 indexes */}
      {isHighWriteAmplification && (
        <div className="p-3 bg-[#141414] border border-[#404040] rounded-md flex items-start gap-3">
          <AlertTriangleIcon className="w-4 h-4 text-[#FFFFFF] mt-0.5 shrink-0" />
          <div className="text-xs space-y-1">
            <span className="font-semibold text-[#FFFFFF]">
              High Write Amplification Risk ({table.indexes.length} Indexes)
            </span>
            <p className="text-[#858585]">
              Every INSERT or UPDATE to &quot;{table.name}&quot; must synchronously update all {table.indexes.length} index B-Trees, multiplying write I/O and transaction commit latency. Consider pruning redundant or low-selectivity indexes.
            </p>
          </div>
        </div>
      )}

      {/* Current Indexes Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
          Configured Indexes ({table.indexes.length})
        </h3>

        <div className="border border-[#262626] rounded-md overflow-hidden bg-[#080808]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#262626] bg-[#0D0D0D] text-[#858585]">
                <th className="py-2 px-3 font-medium">Index Name</th>
                <th className="py-2 px-3 font-medium">Type</th>
                <th className="py-2 px-3 font-medium">Columns</th>
                <th className="py-2 px-3 font-medium text-center">Unique</th>
                <th className="py-2 px-3 font-medium">Size Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {table.indexes.map((idx) => (
                <tr key={idx.id} className="hover:bg-[#0D0D0D] transition-colors">
                  <td className="py-2.5 px-3 font-mono font-medium text-[#FFFFFF]">
                    {idx.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono uppercase text-[#B5B5B5]">
                    {idx.indexType}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#FFFFFF]">
                    ({idx.columnNames.join(", ")})
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {idx.isUnique ? (
                      <span className="text-[10px] text-[#FFFFFF] font-bold">YES</span>
                    ) : (
                      <span className="text-[10px] text-[#666666]">NO</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#858585]">
                    {idx.estimatedSizeBytes
                      ? `${(idx.estimatedSizeBytes / (1024 * 1024)).toFixed(1)} MB`
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Index Optimization Findings */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
          Actionable Index Recommendations ({tableIndexFindings.length})
        </h3>

        {tableIndexFindings.length === 0 ? (
          <div className="p-4 bg-[#080808] border border-[#262626] rounded-md text-xs text-[#858585] flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-[#FFFFFF]" />
            No index redundancy or missing foreign key index issues detected for this table.
          </div>
        ) : (
          <div className="space-y-2">
            {tableIndexFindings.map((finding) => (
              <div
                key={finding.id}
                className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#FFFFFF]">
                    {finding.title}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-md font-mono uppercase bg-[#141414] text-[#B5B5B5] border border-[#333333]">
                    {finding.severity}
                  </span>
                </div>
                <p className="text-xs text-[#858585]">{finding.explanation}</p>
                <div className="p-2.5 bg-[#000000] border border-[#202020] rounded-md text-[11px] font-mono text-[#FFFFFF]">
                  <span className="text-[#666666] block mb-0.5">Remediation:</span>
                  {finding.remediation}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
