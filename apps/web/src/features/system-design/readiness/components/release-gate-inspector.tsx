/**
 * @file apps/web/src/features/system-design/readiness/components/release-gate-inspector.tsx
 * Release Gate Inspector for Phase 05.3.30.
 */

'use client';

import React from 'react';
import {
  ReleaseGateItem,
  ReleaseReadinessPillar,
} from '@nxtqr/architecture-intelligence';
import {
  ShieldIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from '@nxtqr/icons';

interface ReleaseGateInspectorProps {
  gates: ReleaseGateItem[];
  selectedPillar: ReleaseReadinessPillar | 'all';
  onToggleGate: (gateId: string, newStatus: ReleaseGateItem['status']) => void;
}

export const ReleaseGateInspector: React.FC<ReleaseGateInspectorProps> = ({
  gates,
  selectedPillar,
  onToggleGate,
}) => {
  const filteredGates =
    selectedPillar === 'all'
      ? gates
      : gates.filter((g) => g.pillar === selectedPillar);

  const getStatusBadge = (status: ReleaseGateItem['status']) => {
    switch (status) {
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-900/60 bg-emerald-950/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            <CheckCircleIcon className="h-3 w-3" />
            PASSED
          </span>
        );
      case 'failed':
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-red-900/60 bg-red-950/20 px-2 py-0.5 text-[10px] font-medium text-red-400">
            <AlertTriangleIcon className="h-3 w-3" />
            {status.toUpperCase()}
          </span>
        );
      case 'waived':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-neutral-300">
            WAIVED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-900/60 bg-amber-950/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
            UNKNOWN
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>
          Showing <span className="font-medium text-white">{filteredGates.length}</span> release
          gates
          {selectedPillar !== 'all' && (
            <span>
              {' '}
              for pillar <span className="font-semibold text-white uppercase">{selectedPillar}</span>
            </span>
          )}
        </span>
      </div>

      <div className="divide-y divide-neutral-800/80 rounded-md border border-neutral-800 bg-[#080808]">
        {filteredGates.map((gate) => (
          <div key={gate.id} className="p-4 transition-colors hover:bg-[#0D0D0D]">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-white">{gate.id}</span>
                  <span className="rounded-md border border-neutral-800 bg-[#141414] px-1.5 py-0.5 text-[10px] uppercase text-neutral-400">
                    {gate.pillar}
                  </span>
                  {gate.blocker && (
                    <span className="rounded-md border border-red-900/60 bg-red-950/30 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                      BLOCKER
                    </span>
                  )}
                  {getStatusBadge(gate.status)}
                </div>
                <h4 className="text-sm font-medium text-white">{gate.title}</h4>
                <p className="text-xs text-neutral-400">{gate.description}</p>
              </div>

              <div className="flex items-center gap-2 self-start">
                {gate.status === 'passed' ? (
                  <button
                    type="button"
                    onClick={() => onToggleGate(gate.id, 'waived')}
                    className="rounded-md border border-neutral-800 bg-[#121212] px-2 py-1 text-[11px] text-neutral-400 hover:border-neutral-700 hover:text-white"
                  >
                    Mark Waived
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleGate(gate.id, 'passed')}
                    className="rounded-md border border-neutral-800 bg-[#121212] px-2 py-1 text-[11px] text-neutral-400 hover:border-neutral-700 hover:text-white"
                  >
                    Mark Passed
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-500">
              <ShieldIcon className="h-3 w-3 text-neutral-500" />
              <span>
                Evidence Trace:{' '}
                <span className="font-mono text-neutral-400">{gate.evidenceRef}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

