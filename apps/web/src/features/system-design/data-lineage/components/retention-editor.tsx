"use client";

/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Retention Editor Modal Component
 */

import React, { useState } from "react";
import type { DataAsset, DataRetentionPolicy } from "@nxtqr/architecture-intelligence";
import { CloseIcon, LayersIcon } from "@nxtqr/icons";

interface RetentionEditorProps {
  isOpen: boolean;
  asset: DataAsset | null;
  onClose: () => void;
  onSave: (assetId: string, policy: DataRetentionPolicy) => void;
}

export function RetentionEditor({ isOpen, asset, onClose, onSave }: RetentionEditorProps) {
  if (!isOpen || !asset) return null;

  const current = asset.retentionPolicy;
  const [name, setName] = useState(current?.name || `${asset.name} Retention Policy`);
  const [durationDays, setDurationDays] = useState(current?.durationDays ?? 365);
  const [trigger, setTrigger] = useState<DataRetentionPolicy["trigger"]>(
    current?.trigger || "account_closure"
  );
  const [deletionMethod, setDeletionMethod] = useState<DataRetentionPolicy["deletionMethod"]>(
    current?.deletionMethod || "hard_delete"
  );
  const [hasBackupExemption, setHasBackupExemption] = useState(current?.hasBackupExemption ?? true);

  const handleSave = () => {
    onSave(asset.id, {
      id: current?.id || `ret-${Date.now()}`,
      name,
      durationDays: Number(durationDays),
      trigger,
      deletionMethod,
      hasBackupExemption,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-none p-4">
      <div className="w-full max-w-md bg-surface-01 border border-border-default rounded-md shadow-level-2 overflow-hidden space-y-4 p-5 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-default">
          <div className="flex items-center space-x-2">
            <LayersIcon className="w-4 h-4 text-text-secondary" />
            <h3 className="text-sm font-semibold text-foreground">
              Configure Retention Schedule
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-foreground transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-secondary">
              Policy Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-02 text-foreground text-xs px-3 py-1.5 rounded-md border border-border-default focus:border-border-strong focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-secondary">
              Retention Duration (Days)
            </label>
            <input
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full bg-surface-02 text-foreground text-xs px-3 py-1.5 rounded-md border border-border-default focus:border-border-strong focus:outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-secondary">
              Lifecycle Purge Trigger
            </label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as any)}
              className="w-full bg-surface-02 text-foreground text-xs px-3 py-1.5 rounded-md border border-border-default focus:border-border-strong focus:outline-none"
            >
              <option value="account_closure">Account Closure / Termination</option>
              <option value="creation_time">Creation Timestamp Elapsed</option>
              <option value="transaction_completion">Transaction Completion</option>
              <option value="inactivity_period">Inactivity Period Exceeded</option>
              <option value="explicit_request">Explicit User Deletion Request</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-secondary">
              Deletion & Purge Method
            </label>
            <select
              value={deletionMethod}
              onChange={(e) => setDeletionMethod(e.target.value as any)}
              className="w-full bg-surface-02 text-foreground text-xs px-3 py-1.5 rounded-md border border-border-default focus:border-border-strong focus:outline-none"
            >
              <option value="hard_delete">Hard Physical Delete (Purge records)</option>
              <option value="soft_delete">Soft Delete (Tombstone marker)</option>
              <option value="anonymization">Anonymization / Differential Privacy</option>
              <option value="crypto_shredding">Crypto Shredding (Key Destruction)</option>
              <option value="manual_purge">Manual Governance Purge</option>
            </select>
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasBackupExemption}
                onChange={(e) => setHasBackupExemption(e.target.checked)}
                className="rounded border-border-default bg-surface-02 text-foreground focus:ring-0"
              />
              <span className="text-[11px] text-text-secondary">
                Document backup copy exemption (standard rolling disaster recovery backup cycle)
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border-default">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-foreground bg-surface-02 hover:bg-surface-03 border border-border-default rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-md transition-colors shadow-level-1"
          >
            Save Retention Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

