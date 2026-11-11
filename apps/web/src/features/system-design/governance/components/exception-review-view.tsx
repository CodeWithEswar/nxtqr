"use client";

/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Policy Exceptions & Temporary Waivers Review Console
 */

import React, { useState } from "react";
import type { PolicyException } from "@nxtqr/architecture-intelligence";
import {
  CalendarIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "@nxtqr/icons";

export interface ExceptionReviewViewProps {
  exceptions: PolicyException[];
  onAddException?: (exception: PolicyException) => void;
  onRevokeException?: (exceptionId: string) => void;
}

export function ExceptionReviewView({
  exceptions,
  onAddException: _onAddException,
  onRevokeException,
}: ExceptionReviewViewProps) {
  const [filter, setFilter] = useState<string>("all");

  const nowMs = Date.now();

  const filtered = exceptions.filter((ex) => {
    if (filter === "all") return true;
    if (filter === "active") {
      return ex.status === "approved" && !ex.isExpired && new Date(ex.expirationDate).getTime() > nowMs;
    }
    if (filter === "expired") {
      return ex.isExpired || new Date(ex.expirationDate).getTime() <= nowMs;
    }
    return ex.status === filter;
  });

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white p-4 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <CalendarIcon size={16} /> Policy Exceptions & Time-Bound Waivers
          </h2>
          <p className="text-xs text-[#858585] mt-0.5">
            Waivers suppress deployment blocking gates without mutating underlying failure status.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-[#080808] border border-[#262626] p-1 rounded-md text-xs">
          {["all", "active", "expired"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md uppercase font-mono text-[11px] transition-colors ${
                filter === f
                  ? "bg-[#1A1A1A] text-white"
                  : "text-[#858585] hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Exceptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 p-8 text-center text-xs text-[#858585] border border-[#262626] rounded-md bg-[#080808]">
            No policy exceptions match the selected filter.
          </div>
        ) : (
          filtered.map((ex) => {
            const expMs = new Date(ex.expirationDate).getTime();
            const isExpired = ex.isExpired || expMs <= nowMs;
            const remainingDays = Math.ceil((expMs - nowMs) / (86400 * 1000));

            return (
              <div
                key={ex.id}
                className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-white">
                        {ex.id}
                      </span>
                      <span className="text-[11px] font-mono text-[#858585]">
                        Policy: {ex.policyId}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#666666] block">
                      Scope: [{ex.resourceScope.join(", ")}]
                    </span>
                  </div>

                  {isExpired ? (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-[#ef4444] bg-[#0D0D0D] border border-[#262626] px-2 py-0.5 rounded-md">
                      <AlertCircleIcon size={12} /> EXPIRED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-[#22c55e] bg-[#0D0D0D] border border-[#262626] px-2 py-0.5 rounded-md">
                      <CheckCircleIcon size={12} /> {remainingDays}d LEFT
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#B5B5B5] leading-relaxed">
                  {ex.justification}
                </p>

                {/* Compensating Controls */}
                {ex.compensatingControls.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-[#1A1A1A]">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666]">
                      Compensating Controls
                    </span>
                    {ex.compensatingControls.map((cc) => (
                      <div
                        key={cc.id}
                        className="p-2 bg-[#0D0D0D] border border-[#202020] rounded-md text-[11px]"
                      >
                        <div className="flex justify-between text-white font-medium">
                          <span>{cc.title}</span>
                          <span className="text-[10px] font-mono text-[#22c55e]">
                            Verified
                          </span>
                        </div>
                        <span className="text-[10px] text-[#858585] block mt-0.5">
                          {cc.description}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Audit & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[#1A1A1A] text-xs font-mono text-[#858585]">
                  <div>
                    <span>Requester: </span>
                    <span className="text-white">{ex.requesterId}</span>
                  </div>

                  {!isExpired && onRevokeException && (
                    <button
                      onClick={() => onRevokeException(ex.id)}
                      className="text-[11px] text-[#ef4444] hover:text-white bg-[#0D0D0D] hover:bg-[#1A1A1A] border border-[#262626] px-2 py-0.5 rounded-md transition-colors"
                    >
                      Revoke Waiver
                    </button>
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
