"use client";

/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Visual Declarative Policy-as-Code Rule AST Viewer & Builder
 */

import React from "react";
import type { PolicyRule } from "@nxtqr/architecture-intelligence";
import {
  LayersIcon,
} from "@nxtqr/icons";

export interface VisualRuleBuilderProps {
  rule: PolicyRule;
  depth?: number;
  isRoot?: boolean;
}

export function VisualRuleBuilder({
  rule,
  depth = 0,
  isRoot = true,
}: VisualRuleBuilderProps) {
  const isComposite = rule.operator === "all" || rule.operator === "any" || rule.operator === "none";

  return (
    <div
      className={`font-mono text-xs ${
        isRoot
          ? "p-4 bg-[#080808] border border-[#262626] rounded-md space-y-3"
          : "pl-4 border-l border-[#262626] my-2 space-y-2"
      }`}
    >
      {isRoot && (
        <div className="flex items-center justify-between pb-2 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-2 text-white text-xs font-semibold uppercase tracking-wider">
            <LayersIcon size={14} /> Declarative Rule AST (Depth: {depth}/10)
          </div>
          <span className="text-[10px] text-[#858585]">
            Safe Deterministic Interpreter
          </span>
        </div>
      )}

      <div className="flex items-start gap-2">
        {/* Operator Badge */}
        <span
          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
            isComposite
              ? "text-[#FFFFFF] bg-[#1A1A1A] border-[#333333]"
              : "text-[#B5B5B5] bg-[#0D0D0D] border-[#262626]"
          }`}
        >
          {rule.operator}
        </span>

        {/* Property & Expected Value for Leaf Rules */}
        {!isComposite && (
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">
                {rule.targetProperty || "target"}
              </span>
              <span className="text-[#858585]">{rule.operator}</span>
              <span className="text-[#FFFFFF] bg-[#141414] px-1.5 py-0.5 rounded-md border border-[#202020]">
                {Array.isArray(rule.expectedValue)
                  ? `[${rule.expectedValue.join(", ")}]`
                  : String(rule.expectedValue ?? "defined")}
              </span>
            </div>
            {rule.description && (
              <div className="text-[11px] text-[#858585] font-sans">
                {rule.description}
              </div>
            )}
          </div>
        )}

        {isComposite && rule.description && (
          <span className="text-[11px] text-[#858585] font-sans">
            {rule.description}
          </span>
        )}
      </div>

      {/* Recursive Children */}
      {isComposite && rule.children && rule.children.length > 0 && (
        <div className="space-y-1">
          {rule.children.map((child, idx) => (
            <VisualRuleBuilder
              key={child.id || idx}
              rule={child}
              depth={depth + 1}
              isRoot={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
