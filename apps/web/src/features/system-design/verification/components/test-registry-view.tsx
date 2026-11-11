"use client";

/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Architecture Test Registry Component
 */

import React, { useState } from "react";
import type { ArchitectureTest } from "@nxtqr/architecture-intelligence";
import { SearchIcon, FilterIcon } from "@nxtqr/icons";

interface TestRegistryViewProps {
  tests: ArchitectureTest[];
  selectedTestId: string;
  onSelectTest: (testId: string) => void;
}

export function TestRegistryView({
  tests,
  selectedTestId,
  onSelectTest,
}: TestRegistryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(tests.map((t) => t.category)))];

  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-md bg-[#080808] border border-[#262626]">
        <div className="relative w-full sm:w-80">
          <SearchIcon size={14} className="absolute left-3 top-2.5 text-[#858585]" />
          <input
            type="text"
            placeholder="Search architecture tests by ID, title, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-[#262626] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#404040]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FilterIcon size={14} className="text-[#858585]" />
          <span className="text-xs text-[#858585] font-mono">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#0D0D0D] border border-[#262626] rounded-md px-2.5 py-1 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#404040]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.replace("_", " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tests Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredTests.map((test) => {
          const isSelected = test.id === selectedTestId;
          const isCrit = test.severity === "critical";
          const isHigh = test.severity === "high";

          return (
            <button
              key={test.id}
              onClick={() => onSelectTest(test.id)}
              className={`p-4 rounded-md text-left transition-all border space-y-2.5 ${
                isSelected
                  ? "bg-[#1A1A1A] border-[#404040] shadow-level-3"
                  : "bg-[#080808] border-[#262626] hover:border-[#333333] hover:bg-[#0D0D0D]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#FFFFFF] font-bold">{test.id}</span>
                  <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-[#141414] border border-[#262626] text-[#858585]">
                    v{test.version}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-[#141414] border border-[#262626] text-[#B5B5B5]">
                    {test.category}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                      isCrit
                        ? "bg-[#1f1010] border border-[#4a1c1c] text-[#ef4444]"
                        : isHigh
                          ? "bg-[#1a1408] border border-[#423010] text-[#FFAA00]"
                          : "bg-[#141414] border border-[#262626] text-[#B5B5B5]"
                    }`}
                  >
                    {test.severity.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#FFFFFF] leading-snug">{test.title}</h4>
                <p className="text-xs text-[#858585] mt-1 line-clamp-2 leading-relaxed">
                  {test.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#1A1A1A] flex items-center justify-between text-[11px] font-mono text-[#666666]">
                <span>Scope: {test.scope.level}</span>
                <span>
                  {test.requiredEvidenceTypes.length > 0
                    ? `${test.requiredEvidenceTypes.length} evidence req`
                    : "graph-only"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

