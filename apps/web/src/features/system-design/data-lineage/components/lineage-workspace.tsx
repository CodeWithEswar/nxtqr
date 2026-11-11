"use client";

/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Master Studio Lineage Workspace Shell
 */

import React, { useState } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ArchitectureDataLineageModel } from "@nxtqr/architecture-intelligence";
import { useArchitectureLineage } from "../hooks/use-architecture-lineage";
import { DataAssetCatalog } from "./data-asset-catalog";
import { LineageCanvas } from "./lineage-canvas";
import { LineageInspector } from "./lineage-inspector";
import { PrivacyFindings } from "./privacy-findings";
import { RetentionEditor } from "./retention-editor";
import { ImportModal } from "./import-modal";
import {
  LayersIcon,
  ShieldIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@nxtqr/icons";

export interface LineageWorkspaceProps {
  projectId?: string;
  architectureId?: string;
  nodes?: BaseNode[];
  edges?: BaseEdge[];
  initialModel?: ArchitectureDataLineageModel;
}

export function LineageWorkspace(props: LineageWorkspaceProps) {
  const {
    model,
    selectedAssetId,
    selectedAsset,
    selectedFlowId,
    filterMode,
    filteredAssets,
    traversalResult,
    deletionImpact,
    retentionReport,
    transfers,
    privacyFindings,
    isImportModalOpen,
    isRetentionModalOpen,
    setSelectedAssetId,
    setSelectedFlowId,
    setFilterMode,
    setIsImportModalOpen,
    setIsRetentionModalOpen,
    updateAssetClassification,
    updateRetentionPolicy,
    importOpenApiSpec,
  } = useArchitectureLineage(props);

  const [isFindingsDrawerOpen, setIsFindingsDrawerOpen] = useState(true);

  return (
    <div className="flex flex-col h-full w-full bg-black text-foreground overflow-hidden">
      {/* Top Studio Toolbar */}
      <div className="h-12 border-b border-border-default bg-surface-01 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <LayersIcon className="w-4 h-4 text-text-secondary" />
            <h1 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Data Lineage & Privacy Engine
            </h1>
          </div>
          <span className="text-[11px] font-mono text-text-muted">
            Rev: {model.graphRevision} (v{model.version})
          </span>
        </div>

        {/* Quick Summary Metrics */}
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="text-text-muted text-[11px]">Assets:</span>
            <span className="font-mono font-semibold text-foreground">
              {model.assets.length}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-text-muted text-[11px]">Flows:</span>
            <span className="font-mono font-semibold text-foreground">
              {model.flows.length}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-text-muted text-[11px]">Retention:</span>
            <span className="font-mono font-semibold text-foreground">
              {retentionReport.overallCoveragePct}%
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-text-muted text-[11px]">Privacy Findings:</span>
            <span className="font-mono font-semibold text-foreground">
              {privacyFindings.length}
            </span>
          </div>
        </div>
      </div>

      {/* 3-Pane Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Asset Catalog */}
        <div className="w-72 shrink-0 h-full">
          <DataAssetCatalog
            assets={filteredAssets}
            selectedAssetId={selectedAssetId}
            filterMode={filterMode}
            onSelectAsset={setSelectedAssetId}
            onSetFilterMode={setFilterMode}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
        </div>

        {/* Center Pane: Canvas + Bottom Findings Drawer */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Main Visual Canvas */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <LineageCanvas
              selectedAsset={selectedAsset}
              traversalResult={traversalResult}
              flows={model.flows}
              selectedFlowId={selectedFlowId}
              onSelectFlow={setSelectedFlowId}
            />
          </div>

          {/* Bottom Findings Collapsible Section */}
          <div className="border-t border-border-default bg-surface-01 shrink-0">
            <div
              onClick={() => setIsFindingsDrawerOpen(!isFindingsDrawerOpen)}
              className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-surface-02 transition-colors border-b border-border-subtle"
            >
              <div className="flex items-center space-x-2 text-xs font-semibold text-text-secondary">
                <ShieldIcon className="w-3.5 h-3.5 text-text-muted" />
                <span>Governance & Transfer Review Panel ({privacyFindings.length + transfers.length})</span>
              </div>
              <button className="text-text-muted hover:text-foreground">
                {isFindingsDrawerOpen ? (
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUpIcon className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {isFindingsDrawerOpen && (
              <div className="p-3">
                <PrivacyFindings findings={privacyFindings} transfers={transfers} />
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Inspector */}
        <div className="w-80 shrink-0 h-full">
          <LineageInspector
            selectedAsset={selectedAsset}
            deletionImpact={deletionImpact}
            onUpdateClassification={updateAssetClassification}
            onOpenRetentionModal={() => setIsRetentionModalOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <RetentionEditor
        isOpen={isRetentionModalOpen}
        asset={selectedAsset}
        onClose={() => setIsRetentionModalOpen(false)}
        onSave={updateRetentionPolicy}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importOpenApiSpec}
      />
    </div>
  );
}

