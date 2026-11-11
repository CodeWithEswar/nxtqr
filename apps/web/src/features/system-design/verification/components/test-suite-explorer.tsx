"use client";

/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Test Suite Explorer & Cycle Validator Component
 */

import React from "react";
import type { ArchitectureTestSuite, ArchitectureTest } from "@nxtqr/architecture-intelligence";
import { SuiteRegistry } from "@nxtqr/architecture-intelligence";
import { CheckCircleIcon, ShieldIcon } from "@nxtqr/icons";

interface TestSuiteExplorerProps {
  suites: ArchitectureTestSuite[];
  allTests: ArchitectureTest[];
  selectedSuiteId: string;
  onSelectSuite: (suiteId: string) => void;
}

export function TestSuiteExplorer({
  suites,
  allTests,
  selectedSuiteId,
  onSelectSuite,
}: TestSuiteExplorerProps) {
  const selectedSuite = suites.find((s) => s.id === selectedSuiteId) || suites[0];
  const acyclicityCheck = SuiteRegistry.validateSuiteAcyclicity(suites);

  return (
    <div className="space-y-6">
      {/* Acyclicity & Validation Banner */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-mono text-[#858585]">Suite Dependency Integrity</div>
          <h3 className="text-base font-bold text-[#FFFFFF] mt-0.5">Dependency-Aware Test Suites</h3>
          <p className="text-xs text-[#858585] mt-1">
            Group architecture assertions into reusable, immutable suites with cycle-safe DAG dependency resolution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] text-center shrink-0">
            <div className="text-[10px] font-mono uppercase text-[#858585]">Suite Graph</div>
            <div
              className={`text-sm font-mono font-bold mt-0.5 flex items-center gap-1.5 ${
                !acyclicityCheck.hasCycles ? "text-[#22c55e]" : "text-[#ef4444]"
              }`}
            >
              <CheckCircleIcon size={14} />
              {!acyclicityCheck.hasCycles ? "ACYCLIC (VALID)" : "CYCLE DETECTED"}
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column: Suites Catalog & Selected Suite Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Suites List */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
            Architecture Test Suites ({suites.length})
          </div>

          <div className="space-y-2">
            {suites.map((suite) => {
              const isSelected = suite.id === selectedSuiteId;
              return (
                <button
                  key={suite.id}
                  onClick={() => onSelectSuite(suite.id)}
                  className={`w-full p-3.5 text-left rounded-md transition-all border space-y-1.5 ${
                    isSelected
                      ? "bg-[#1A1A1A] border-[#404040] shadow-level-3"
                      : "bg-[#080808] border-[#262626] hover:border-[#333333] hover:bg-[#0D0D0D]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#858585]">{suite.id}</span>
                    <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-[#141414] text-[#22c55e] border border-[#262626]">
                      {suite.status.toUpperCase()}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-[#FFFFFF] leading-snug">{suite.title}</h4>
                  <p className="text-xs text-[#858585] line-clamp-1">{suite.description}</p>

                  <div className="pt-2 border-t border-[#1A1A1A] flex items-center justify-between text-[11px] text-[#858585] font-mono">
                    <span>{suite.testIds.length} tests</span>
                    <span>v{suite.version}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Suite Details & Test List */}
        {selectedSuite && (
          <div className="lg:col-span-2 rounded-md bg-[#080808] border border-[#262626] p-5 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#262626]">
              <div>
                <div className="text-xs uppercase font-mono text-[#858585]">
                  {selectedSuite.id} · v{selectedSuite.version}
                </div>
                <h3 className="text-lg font-bold text-[#FFFFFF] mt-0.5">{selectedSuite.title}</h3>
                <p className="text-xs text-[#B5B5B5] mt-1">{selectedSuite.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#141414] border border-[#333333] text-[#B5B5B5]">
                  Author: {selectedSuite.createdBy}
                </span>
              </div>
            </div>

            {/* Included Tests */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
                Pinned Tests Included in Suite ({selectedSuite.testIds.length})
              </div>

              <div className="space-y-2">
                {selectedSuite.testIds.map((tid) => {
                  const testDef = allTests.find((t) => t.id === tid);
                  return (
                    <div
                      key={tid}
                      className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-[#858585] font-bold">{tid}</span>
                          <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-[#141414] border border-[#262626] text-[#B5B5B5]">
                            {testDef?.category || "general"}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-[#FFFFFF]">
                          {testDef?.title || tid}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#141414] text-[#FFAA00] border border-[#333333]">
                          {testDef?.severity.toUpperCase() || "MEDIUM"}
                        </span>
                        <ShieldIcon size={14} className="text-[#858585]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

