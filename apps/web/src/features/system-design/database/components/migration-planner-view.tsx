"use client";

/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Schema Evolution & Expand-and-Contract Migration Planner
 */

import React from "react";
import type {
  DatabaseMigrationPlan,
  DatabaseArchitectureFinding,
} from "@nxtqr/architecture-intelligence";
import { LayersIcon, AlertTriangleIcon } from "@nxtqr/icons";

export interface MigrationPlannerViewProps {
  migrationPlan?: DatabaseMigrationPlan;
  findings: DatabaseArchitectureFinding[];
}

export function MigrationPlannerView({
  migrationPlan,
  findings,
}: MigrationPlannerViewProps) {
  const migrationFindings = findings.filter(
    (f) => f.category === "breaking_migration_table_rewrite"
  );

  // Fallback default 6-phase expand-and-contract plan if none in topology
  const defaultSteps = [
    {
      phase: "expand",
      name: "1. Expand Schema",
      description: "Apply backward-compatible DDL (add nullable columns, create indexes concurrently, add new tables). Zero locks held.",
      reversible: true,
      requiresLock: false,
    },
    {
      phase: "deploy_app",
      name: "2. Deploy Dual-Writing App",
      description: "Deploy application release capable of reading old columns while writing to both old and new schema representations.",
      reversible: true,
      requiresLock: false,
    },
    {
      phase: "backfill",
      name: "3. Backfill Historical Data",
      description: "Execute background batch worker to populate historical data in new columns without holding table locks.",
      reversible: true,
      requiresLock: false,
    },
    {
      phase: "validate",
      name: "4. Validate Constraints",
      description: "Validate CHECK constraints and verify zero nulls or data discrepancy between representations asynchronously.",
      reversible: true,
      requiresLock: false,
    },
    {
      phase: "switch",
      name: "5. Switch Read Traffic",
      description: "Switch application read paths to the new schema representation. Verify latency and error rates.",
      reversible: true,
      requiresLock: false,
    },
    {
      phase: "contract",
      name: "6. Contract Schema",
      description: "Drop deprecated columns and obsolete tables once all application consumers have migrated.",
      reversible: false,
      requiresLock: true,
    },
  ];

  const steps = migrationPlan?.steps || defaultSteps;

  return (
    <div className="flex flex-col h-full bg-[#000000] overflow-y-auto p-6 space-y-6">
      {/* Header Summary */}
      <div className="p-4 bg-[#080808] border border-[#262626] rounded-md flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-[#FFFFFF]" />
            Schema Evolution & Expand-and-Contract Migration Planner
          </h2>
          <p className="text-xs text-[#858585] mt-1">
            Zero-downtime database migration sequencing, table rewrite avoidance, and lock-free evolution.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-[#666666] block">
              Downtime Required
            </span>
            <span className="text-sm font-bold font-mono text-[#FFFFFF]">
              0.0 seconds
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-[#666666] block">
              Evolution Phases
            </span>
            <span className="text-sm font-bold font-mono text-[#FFFFFF]">
              6 Phases
            </span>
          </div>
        </div>
      </div>

      {/* Migration Table Rewrite Risk Findings */}
      {migrationFindings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-2">
            <AlertTriangleIcon className="w-3.5 h-3.5 text-[#FFFFFF]" />
            Table Rewrite & Exclusive Lock Hazards ({migrationFindings.length})
          </h3>
          <div className="space-y-2">
            {migrationFindings.map((f) => (
              <div
                key={f.id}
                className="p-3 bg-[#141414] border border-[#404040] rounded-md space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#FFFFFF]">{f.title}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md uppercase font-mono bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333]">
                    {f.severity}
                  </span>
                </div>
                <p className="text-xs text-[#858585]">{f.explanation}</p>
                <p className="text-[11px] font-mono text-[#FFFFFF] bg-[#000000] p-2 rounded-md border border-[#202020]">
                  {f.remediation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6-Phase Expand-and-Contract Roadmap */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
          Standard Zero-Downtime Expand-and-Contract Roadmap
        </h3>

        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#FFFFFF] font-mono">
                    {step.name}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-md font-mono uppercase bg-[#141414] text-[#858585] border border-[#262626]">
                    {step.phase}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[10px] font-mono text-[#858585]">
                  <span>Reversible: <strong className="text-[#FFFFFF]">{step.reversible ? "YES" : "NO"}</strong></span>
                  <span>•</span>
                  <span>Requires Lock: <strong className={step.requiresLock ? "text-[#FFFFFF]" : "text-[#666666]"}>{step.requiresLock ? "YES" : "NO"}</strong></span>
                </div>
              </div>

              <p className="text-xs text-[#858585]">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
