/**
 * @file apps/web/src/features/system-design/readiness/components/capability-matrix-view.tsx
 * Interactive Capability Inventory Matrix across all 30 subphases of Phase 05.3.
 */

'use client';

import React, { useState } from 'react';
import { CapabilityInventoryItem } from '@nxtqr/architecture-intelligence';
import {
  SearchIcon,
  FilterIcon,
  CheckCircleIcon,
  ShieldIcon,
  ActivityIcon,
  LayersIcon,
} from '@nxtqr/icons';

interface CapabilityMatrixViewProps {
  capabilities: CapabilityInventoryItem[];
  allCount: number;
  searchQuery: string;
  categoryFilter: string;
  statusFilter: string;
  onSearchChange: (q: string) => void;
  onCategoryChange: (c: string) => void;
  onStatusChange: (s: string) => void;
}

export const CapabilityMatrixView: React.FC<CapabilityMatrixViewProps> = ({
  capabilities,
  allCount,
  searchQuery,
  categoryFilter,
  statusFilter,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}) => {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const toggleExpand = (phase: string) => {
    setExpandedPhase(expandedPhase === phase ? null : phase);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-md border border-neutral-800 bg-[#080808] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search capabilities by phase, title, or module path..."
            className="w-full rounded-md border border-neutral-800 bg-[#0D0D0D] py-1.5 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:border-neutral-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <FilterIcon className="h-3.5 w-3.5 text-neutral-500" />
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="rounded-md border border-neutral-800 bg-[#0D0D0D] px-2.5 py-1.5 text-xs text-neutral-300 focus:border-neutral-600 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="core_analysis">Core Analysis</option>
              <option value="specialized_intelligence">Specialized Intelligence</option>
              <option value="planning_operations">Planning & Operations</option>
              <option value="orchestration_readiness">Orchestration & Readiness</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-md border border-neutral-800 bg-[#0D0D0D] px-2.5 py-1.5 text-xs text-neutral-300 focus:border-neutral-600 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="integrated">Integrated</option>
            <option value="implemented_tested">Implemented & Tested</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-xs text-neutral-400">
        <span>
          Showing <span className="font-medium text-white">{capabilities.length}</span> of{' '}
          <span className="font-medium text-white">{allCount}</span> capabilities
        </span>
        <span className="text-emerald-400">100% of planned 30 subphases integrated</span>
      </div>

      {/* Capabilities List Table */}
      <div className="overflow-hidden rounded-md border border-neutral-800 bg-[#080808]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-[#0D0D0D] text-neutral-400">
                <th className="px-4 py-3 font-medium">Phase</th>
                <th className="px-4 py-3 font-medium">Title & Category</th>
                <th className="px-4 py-3 font-medium">Module Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Tests</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {capabilities.map((item) => {
                const isExpanded = expandedPhase === item.phase;

                return (
                  <React.Fragment key={item.phase}>
                    <tr
                      onClick={() => toggleExpand(item.phase)}
                      className="cursor-pointer transition-colors hover:bg-[#0D0D0D]"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] font-semibold text-white">
                        {item.phase}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{item.title}</div>
                        <div className="text-[11px] capitalize text-neutral-500">
                          {item.category.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-neutral-400">
                        {item.modulePath.replace('packages/architecture-intelligence/', '')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-900/60 bg-emerald-950/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          <CheckCircleIcon className="h-3 w-3" />
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="text-[11px] text-neutral-400">
                          {item.testSuites.length} suite(s)
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          className="rounded-md border border-neutral-800 bg-[#141414] px-2 py-1 text-[11px] text-neutral-300 hover:border-neutral-700 hover:text-white"
                        >
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-[#0C0C0C]">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
                            <div className="rounded-md border border-neutral-800/80 bg-[#121212] p-3">
                              <div className="flex items-center gap-1.5 font-medium text-white">
                                <LayersIcon className="h-3.5 w-3.5 text-neutral-400" />
                                Public Interfaces & Dependencies
                              </div>
                              <div className="mt-2 space-y-1">
                                <div className="text-[11px] text-neutral-400">
                                  Interfaces:{' '}
                                  <span className="font-mono text-neutral-300">
                                    {item.publicInterfaces.join(', ')}
                                  </span>
                                </div>
                                <div className="text-[11px] text-neutral-400">
                                  Dependencies:{' '}
                                  <span className="font-mono text-neutral-300">
                                    {item.dependencies.join(', ')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-md border border-neutral-800/80 bg-[#121212] p-3">
                              <div className="flex items-center gap-1.5 font-medium text-white">
                                <ShieldIcon className="h-3.5 w-3.5 text-neutral-400" />
                                Security & Authorization Posture
                              </div>
                              <p className="mt-2 text-[11px] leading-relaxed text-neutral-300">
                                {item.securityNotes}
                              </p>
                            </div>

                            <div className="rounded-md border border-neutral-800/80 bg-[#121212] p-3">
                              <div className="flex items-center gap-1.5 font-medium text-white">
                                <ActivityIcon className="h-3.5 w-3.5 text-neutral-400" />
                                Performance & Evidence Traceability
                              </div>
                              <div className="mt-2 space-y-1 text-[11px] text-neutral-300">
                                <div>
                                  <span className="text-neutral-500">Performance:</span>{' '}
                                  {item.performanceNotes}
                                </div>
                                <div>
                                  <span className="text-neutral-500">Evidence:</span>{' '}
                                  {item.evidenceNotes}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

