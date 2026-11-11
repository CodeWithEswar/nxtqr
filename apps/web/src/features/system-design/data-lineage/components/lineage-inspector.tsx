"use client";

/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Lineage Inspector Component
 */

import React from "react";
import type {
  DataAsset,
  DataSensitivityLevel,
  PrivacyDataCategory,
  DeletionPropagationImpact,
} from "@nxtqr/architecture-intelligence";
import {
  ShieldIcon,
  TrashIcon,
  LayersIcon,
  AlertCircleIcon,
} from "@nxtqr/icons";

interface LineageInspectorProps {
  selectedAsset: DataAsset | null;
  deletionImpact: DeletionPropagationImpact | null;
  onUpdateClassification: (
    assetId: string,
    level: DataSensitivityLevel,
    categories: PrivacyDataCategory[]
  ) => void;
  onOpenRetentionModal: () => void;
}

const ALL_CATEGORIES: PrivacyDataCategory[] = [
  "personal_data",
  "financial",
  "payment",
  "health",
  "authentication",
  "behavioral",
  "operational",
];

export function LineageInspector({
  selectedAsset,
  deletionImpact,
  onUpdateClassification,
  onOpenRetentionModal,
}: LineageInspectorProps) {
  if (!selectedAsset) {
    return (
      <div className="w-80 h-full bg-surface-01 border-l border-border-default p-4 text-xs text-text-muted flex items-center justify-center">
        Select a data asset to inspect governance controls, fields, and retention schedules.
      </div>
    );
  }

  const currentLevel = selectedAsset.classification.level;
  const currentCategories = selectedAsset.classification.categories;

  const handleLevelChange = (level: DataSensitivityLevel) => {
    onUpdateClassification(selectedAsset.id, level, currentCategories);
  };

  const handleToggleCategory = (cat: PrivacyDataCategory) => {
    const exists = currentCategories.includes(cat);
    const updated = exists
      ? currentCategories.filter((c) => c !== cat)
      : [...currentCategories, cat];
    onUpdateClassification(selectedAsset.id, currentLevel, updated);
  };

  const readinessScore = deletionImpact?.propagationReadinessPct ?? 100;

  return (
    <div className="w-80 h-full bg-surface-01 border-l border-border-default overflow-y-auto p-4 space-y-6 text-xs">
      {/* Header */}
      <div className="space-y-1 pb-3 border-b border-border-default">
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
          Asset Governance Inspector
        </span>
        <h3 className="text-sm font-semibold text-foreground truncate">
          {selectedAsset.name}
        </h3>
        <p className="text-[11px] text-text-muted">
          Asset ID: <span className="font-mono text-text-secondary">{selectedAsset.id}</span>
        </p>
      </div>

      {/* Sensitivity Classification Selector */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary flex items-center space-x-1.5">
          <ShieldIcon className="w-3.5 h-3.5 text-text-muted" />
          <span>Sensitivity Level</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {(["public", "internal", "confidential", "restricted"] as const).map((lvl) => {
            const isSelected = lvl === currentLevel;
            return (
              <button
                key={lvl}
                onClick={() => handleLevelChange(lvl)}
                className={`px-2 py-1.5 rounded-md text-left font-medium capitalize transition-colors ${
                  isSelected
                    ? "bg-surface-04 text-foreground border border-border-strong font-semibold shadow-level-1"
                    : "bg-surface-02 text-text-muted hover:text-text-secondary border border-border-subtle"
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Privacy Data Categories */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
          Privacy Data Categories
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_CATEGORIES.map((cat) => {
            const isSelected = currentCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => handleToggleCategory(cat)}
                className={`px-2 py-1 rounded-md text-[11px] transition-colors ${
                  isSelected
                    ? "bg-surface-04 text-foreground border border-border-strong font-medium"
                    : "bg-surface-02 text-text-muted hover:text-text-secondary border border-border-subtle"
                }`}
              >
                {cat.replace("_", " ")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Fields Breakdown */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary flex items-center justify-between">
          <span>Schema Fields ({selectedAsset.fields?.length || 0})</span>
        </label>
        {!selectedAsset.fields || selectedAsset.fields.length === 0 ? (
          <div className="p-2.5 bg-surface-02 border border-border-subtle rounded-md text-text-muted text-[11px]">
            No granular fields declared. Payload treated as aggregate object.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {selectedAsset.fields.map((field) => (
              <div
                key={field.id}
                className="p-2 bg-surface-02 border border-border-subtle rounded-md flex items-center justify-between"
              >
                <div>
                  <span className="font-mono text-foreground">{field.name}</span>
                  <span className="text-[10px] text-text-muted ml-1.5">({field.logicalType})</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-1 rounded bg-surface-03 text-text-secondary border border-border-subtle">
                  {field.classification.level}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Retention Schedule Policy */}
      <div className="space-y-2 pt-2 border-t border-border-default">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary flex items-center space-x-1.5">
            <LayersIcon className="w-3.5 h-3.5 text-text-muted" />
            <span>Retention Schedule</span>
          </label>
          <button
            onClick={onOpenRetentionModal}
            className="text-[11px] text-foreground hover:underline font-medium"
          >
            Configure
          </button>
        </div>

        {selectedAsset.retentionPolicy ? (
          <div className="p-2.5 bg-surface-02 border border-border-subtle rounded-md space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-text-muted">Policy Name:</span>
              <span className="text-foreground font-medium">{selectedAsset.retentionPolicy.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Duration:</span>
              <span className="text-foreground font-mono">
                {selectedAsset.retentionPolicy.durationDays} days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Trigger:</span>
              <span className="text-text-secondary font-mono">
                {selectedAsset.retentionPolicy.trigger}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Method:</span>
              <span className="text-text-secondary font-mono">
                {selectedAsset.retentionPolicy.deletionMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Backup Exemption:</span>
              <span>{selectedAsset.retentionPolicy.hasBackupExemption ? "Documented" : "None"}</span>
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-surface-02 border border-border-subtle rounded-md text-text-disabled text-[11px]">
            No active retention policy. Records retained indefinitely.
          </div>
        )}
      </div>

      {/* Deletion Cascade & RTBF Readiness */}
      <div className="space-y-2 pt-2 border-t border-border-default">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary flex items-center space-x-1.5">
          <TrashIcon className="w-3.5 h-3.5 text-text-muted" />
          <span>Deletion Cascade (RTBF)</span>
        </label>

        <div className="p-2.5 bg-surface-02 border border-border-subtle rounded-md space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-muted">Readiness Score:</span>
            <span className="font-mono font-semibold text-foreground">
              {readinessScore}%
            </span>
          </div>

          <div className="w-full bg-surface-03 rounded-full h-1.5 overflow-hidden border border-border-subtle">
            <div
              className={`h-full ${
                readinessScore >= 80 ? "bg-foreground" : "bg-text-muted"
              }`}
              style={{ width: `${readinessScore}%` }}
            />
          </div>

          {deletionImpact && deletionImpact.uncoveredDestinations.length > 0 && (
            <div className="text-[10px] text-text-muted space-y-1 pt-1">
              <span className="text-text-secondary font-medium">Uncovered Destinations:</span>
              {deletionImpact.uncoveredDestinations.map((u) => (
                <div key={u.componentId} className="flex items-start space-x-1">
                  <AlertCircleIcon className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
                  <span>
                    <strong>{u.componentName}</strong>: {u.risk}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ownership & Accountability */}
      <div className="space-y-1.5 pt-2 border-t border-border-default text-[11px]">
        <label className="font-semibold uppercase tracking-wider text-text-secondary">
          Data Ownership
        </label>
        <div className="text-text-muted space-y-0.5">
          <div>Technical Owner: <span className="text-text-secondary">{selectedAsset.owner?.technicalOwner || "Unassigned"}</span></div>
          <div>Business Owner: <span className="text-text-secondary">{selectedAsset.owner?.businessOwner || "Unassigned"}</span></div>
          <div>Data Steward: <span className="text-text-secondary">{selectedAsset.owner?.dataSteward || "Unassigned"}</span></div>
        </div>
      </div>
    </div>
  );
}

