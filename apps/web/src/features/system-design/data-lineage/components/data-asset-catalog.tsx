"use client";

/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Data Asset Catalog Component
 */

import React, { useState } from "react";
import type { DataAsset, DataSensitivityLevel } from "@nxtqr/architecture-intelligence";
import type { LineageFilterMode } from "../hooks/use-architecture-lineage";
import { PlusIcon, SearchIcon, FilterIcon, DatabaseIcon } from "@nxtqr/icons";

interface DataAssetCatalogProps {
  assets: DataAsset[];
  selectedAssetId: string;
  filterMode: LineageFilterMode;
  onSelectAsset: (assetId: string) => void;
  onSetFilterMode: (mode: LineageFilterMode) => void;
  onOpenImportModal: () => void;
}

export function DataAssetCatalog({
  assets,
  selectedAssetId,
  filterMode,
  onSelectAsset,
  onSetFilterMode,
  onOpenImportModal,
}: DataAssetCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = assets.filter((asset) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(q) ||
      asset.classification.level.toLowerCase().includes(q) ||
      asset.classification.categories.some((c) => c.toLowerCase().includes(q)) ||
      asset.owner?.technicalOwner?.toLowerCase().includes(q)
    );
  });

  const getSensitivityBadge = (level: DataSensitivityLevel) => {
    switch (level) {
      case "restricted":
        return "bg-surface-04 text-foreground border border-border-strong font-semibold";
      case "confidential":
        return "bg-surface-03 text-text-secondary border border-border-default font-medium";
      case "internal":
        return "bg-surface-02 text-text-muted border border-border-subtle";
      case "public":
        return "bg-surface-01 text-text-disabled border border-border-subtle";
      default:
        return "bg-surface-02 text-text-muted border border-border-subtle";
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-01 border-r border-border-default overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border-default space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DatabaseIcon className="w-4 h-4 text-text-secondary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Data Assets ({assets.length})
            </span>
          </div>
          <button
            onClick={onOpenImportModal}
            className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium text-foreground bg-surface-03 hover:bg-surface-04 border border-border-default hover:border-border-hover rounded-md transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Import Spec</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search assets, classifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-02 text-foreground text-xs pl-8 pr-3 py-1.5 rounded-md border border-border-default focus:border-border-strong focus:outline-none placeholder:text-text-muted"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px]">
          <FilterIcon className="w-3 h-3 text-text-muted shrink-0 ml-0.5" />
          {(
            [
              { key: "all", label: "All" },
              { key: "confidential_restricted", label: "Sensitive" },
              { key: "third_party", label: "3rd Party" },
              { key: "uncovered_retention", label: "No Retention" },
              { key: "uncovered_deletion", label: "No RTBF" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => onSetFilterMode(tab.key)}
              className={`px-2 py-0.5 rounded-md shrink-0 transition-colors ${
                filterMode === tab.key
                  ? "bg-surface-04 text-foreground font-medium border border-border-strong"
                  : "bg-surface-02 text-text-muted hover:text-text-secondary border border-border-subtle"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-xs text-text-muted">
            No data assets matching the active criteria.
          </div>
        ) : (
          filtered.map((asset) => {
            const isSelected = asset.id === selectedAssetId;
            return (
              <div
                key={asset.id}
                onClick={() => onSelectAsset(asset.id)}
                className={`p-3 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-surface-03 border-l-2 border-l-foreground border-b border-border-default"
                    : "hover:bg-surface-02"
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-xs font-semibold text-foreground truncate pr-2">
                    {asset.name}
                  </h4>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0 ${getSensitivityBadge(
                      asset.classification.level
                    )}`}
                  >
                    {asset.classification.level}
                  </span>
                </div>

                {asset.description && (
                  <p className="text-[11px] text-text-muted line-clamp-1 mb-2">
                    {asset.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span className="flex items-center space-x-1">
                    <DatabaseIcon className="w-3 h-3" />
                    <span>{asset.storageBindings.length} stores</span>
                  </span>
                  {asset.retentionPolicy?.durationDays && asset.retentionPolicy.durationDays > 0 ? (
                    <span className="text-text-secondary">
                      {asset.retentionPolicy.durationDays}d retention
                    </span>
                  ) : (
                    <span className="text-text-disabled">No retention</span>
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

