"use client";

/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Visual Assertion Builder & AST Inspector Component
 */

import React from "react";
import type { ArchitectureTest, ArchitectureAssertion } from "@nxtqr/architecture-intelligence";
import { TerminalIcon, LayersIcon } from "@nxtqr/icons";

interface VisualAssertionBuilderProps {
  test: ArchitectureTest;
}

export function VisualAssertionBuilder({ test }: VisualAssertionBuilderProps) {
  const renderAssertionNode = (assertion: ArchitectureAssertion, depth = 0): React.ReactNode => {
    if (assertion.children && assertion.children.length > 0) {
      return (
        <div key={depth} className="space-y-2 pl-4 border-l border-[#262626] my-2">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded-md font-mono text-[10px] bg-[#141414] text-[#FFAA00] border border-[#333333] font-bold uppercase">
              {assertion.operator} OF ({assertion.children.length})
            </span>
          </div>
          {assertion.children.map((child, idx) => (
            <div key={idx}>{renderAssertionNode(child, depth + 1)}</div>
          ))}
        </div>
      );
    }

    return (
      <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-1.5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-[#141414] text-[#22c55e] border border-[#262626] font-bold">
            ASSERT
          </span>
          <span className="text-[#FFFFFF]">{assertion.path || "(root entity)"}</span>
          <span className="text-[#FFAA00]">{assertion.operator.toUpperCase()}</span>
          {assertion.targetValue !== undefined && (
            <span className="text-[#60a5fa]">{JSON.stringify(assertion.targetValue)}</span>
          )}
        </div>

        {assertion.evidenceType && (
          <div className="text-[11px] text-[#858585]">
            Requires Evidence: <span className="text-[#FFFFFF]">{assertion.evidenceType}</span>
            {assertion.maxAgeHours && ` (max age: ${assertion.maxAgeHours}h)`}
          </div>
        )}

        {assertion.fromNodeId && assertion.toNodeId && (
          <div className="text-[11px] text-[#858585]">
            Reachability: <span className="text-[#FFFFFF]">{assertion.fromNodeId}</span> →{" "}
            <span className="text-[#FFFFFF]">{assertion.toNodeId}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Visual Rule Structured DSL Card */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <LayersIcon size={16} className="text-[#FFFFFF]" />
            <h3 className="text-sm font-bold text-[#FFFFFF]">Declarative Assertion Rule</h3>
          </div>
          <span className="text-xs font-mono text-[#858585]">{test.id} · v{test.version}</span>
        </div>

        <div className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded-md font-mono text-[10px] bg-[#141414] text-[#38bdf8] border border-[#262626] font-bold">
              WHEN
            </span>
            <span className="text-[#B5B5B5]">
              Scope level is <strong className="text-[#FFFFFF]">{test.scope.level.toUpperCase()}</strong>
              {test.scope.environment && ` in [${test.scope.environment}]`}
              {test.scope.targetIds && test.scope.targetIds.length > 0 && ` for [${test.scope.targetIds.join(", ")}]`}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="px-1.5 py-0.5 rounded-md font-mono text-[10px] bg-[#141414] text-[#a78bfa] border border-[#262626] font-bold">
              CATEGORY
            </span>
            <span className="text-[#B5B5B5]">
              Architecture domain is <strong className="text-[#FFFFFF]">{test.category}</strong>
            </span>
          </div>
        </div>

        <div className="pt-2">
          <div className="text-[11px] font-mono text-[#858585] uppercase mb-2">
            Evaluated Assertions Tree:
          </div>
          {renderAssertionNode(test.assertion)}
        </div>
      </div>

      {/* Raw AST Code Box (Read-only, Zero Arbitrary Execution) */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-[#262626]">
          <TerminalIcon size={14} className="text-[#858585]" />
          <h4 className="text-xs font-mono uppercase text-[#858585]">Immutable AST Definition</h4>
        </div>
        <pre className="p-3 rounded-md bg-[#050505] border border-[#1A1A1A] text-[11px] font-mono text-[#22c55e] overflow-x-auto leading-relaxed">
          {JSON.stringify(test.assertion, null, 2)}
        </pre>
      </div>
    </div>
  );
}

