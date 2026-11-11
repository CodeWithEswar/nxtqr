"use client";

/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * State Ownership & Distributed Lock Safety Inspector
 */

import React from "react";
import type {
  DistributedStateTopology,
  StateOwner,
} from "@nxtqr/architecture-intelligence";
import {
  LockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "@nxtqr/icons";

export interface StateOwnershipViewProps {
  topology: DistributedStateTopology;
}

export function StateOwnershipView({ topology }: StateOwnershipViewProps) {
  // Group state owners by domain
  const ownersByDomain = new Map<string, StateOwner[]>();
  for (const owner of topology.stateOwners) {
    const list = ownersByDomain.get(owner.stateDomain) || [];
    list.push(owner);
    ownersByDomain.set(owner.stateDomain, list);
  }

  return (
    <div className="flex-1 flex flex-col bg-[#000000] text-[#FFFFFF] overflow-y-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-3">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <LockIcon className="w-4 h-4 text-[#858585]" />
            Distributed State Ownership & Lock Safety
          </h2>
          <p className="text-xs text-[#858585] mt-0.5">
            Martin Kleppmann fencing token verification, optimistic concurrency control (OCC), and exclusive writer coordination.
          </p>
        </div>
        <span className="text-xs font-mono text-[#858585] px-2 py-0.5 rounded-md bg-[#080808] border border-[#262626]">
          {topology.stateOwners.length} Registered Writers
        </span>
      </div>

      {/* State Domains List */}
      <div className="space-y-4">
        {Array.from(ownersByDomain.entries()).map(([domain, owners]) => {
          const hasMultipleWriters = owners.length > 1;

          return (
            <div
              key={domain}
              className={`p-4 rounded-md border bg-[#080808] space-y-3 ${
                hasMultipleWriters ? "border-[#404040]" : "border-[#262626]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#FFFFFF] font-mono">
                      Domain: {domain}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#141414] text-[#858585] border border-[#262626]">
                      {owners[0]?.stateType || "entity"}
                    </span>
                  </div>
                  <p className="text-xs text-[#858585] font-mono mt-0.5">
                    {owners.length} registered writing service(s)
                  </p>
                </div>

                {hasMultipleWriters && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#1A1A1A] border border-[#404040] text-[10px] font-mono text-[#FFFFFF]">
                    <AlertTriangleIcon className="w-3 h-3 text-[#B5B5B5]" />
                    <span>Multiple Writers Detected</span>
                  </div>
                )}
              </div>

              {/* Owners details */}
              <div className="space-y-2 mt-2">
                {owners.map((owner) => {
                  const lock = owner.distributedLockConfig;

                  return (
                    <div
                      key={owner.id}
                      className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#FFFFFF] font-medium">
                          Service: {owner.serviceId}
                        </span>
                        <div className="flex items-center gap-2">
                          {owner.optimisticConcurrencyField ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#141414] text-[#FFFFFF] border border-[#262626]">
                              OCC: {owner.optimisticConcurrencyField}
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#141414] text-[#666666] border border-[#262626]">
                              No OCC Field
                            </span>
                          )}

                          {owner.isExclusiveAuthoritativeWriter ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#141414] text-[#FFFFFF] border border-[#262626]">
                              Exclusive
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#1A1A1A] text-[#B5B5B5] border border-[#404040]">
                              Shared Writer
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Distributed Lock Details */}
                      {lock && (
                        <div className="p-2.5 rounded-md bg-[#141414] border border-[#262626] text-xs font-mono flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-[#858585] block">
                              Lock Manager: {lock.name} ({lock.lockManagerTechnology})
                            </span>
                            <span className="text-[#B5B5B5] text-[11px]">
                              Lease: {lock.leaseDurationMs}ms • Auto-Renewal:{" "}
                              {lock.autoRenewal ? "Yes" : "No"}
                            </span>
                          </div>

                          <div className="text-right">
                            {lock.hasFencingToken ? (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0D0D0D] border border-[#262626] text-[10px] text-[#FFFFFF]">
                                <CheckCircleIcon className="w-3 h-3 text-[#B5B5B5]" />
                                <span>Fencing Token Protected</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#1A1A1A] border border-[#404040] text-[10px] text-[#FFFFFF]">
                                <AlertTriangleIcon className="w-3 h-3 text-[#B5B5B5]" />
                                <span>Kleppmann Fencing Gap</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
