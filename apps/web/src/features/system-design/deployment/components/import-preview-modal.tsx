"use client";

/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * IaC Import Preview Modal
 */

import React, { useState } from "react";
import type { ImportPreviewResult } from "@nxtqr/architecture-intelligence";
import { ImportRegistry } from "@nxtqr/architecture-intelligence";
import { CloseIcon, ShieldIcon } from "@nxtqr/icons";

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  environmentId: string;
  onConfirmImport: (content: string, format?: "terraform" | "kubernetes" | "auto") => void;
}

export function ImportPreviewModal({
  isOpen,
  onClose,
  environmentId,
  onConfirmImport,
}: ImportPreviewModalProps) {
  const [content, setContent] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<"auto" | "terraform" | "kubernetes">("auto");
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = () => {
    setError(null);
    try {
      const res = ImportRegistry.parse(content, environmentId, selectedFormat);
      setPreview(res);
    } catch (e: any) {
      setError(e.message || "Failed to parse infrastructure code.");
    }
  };

  const handleApply = () => {
    if (!content.trim()) return;
    onConfirmImport(content, selectedFormat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/80 backdrop-blur-none p-4">
      <div className="w-full max-w-2xl bg-[#080808] border border-[#262626] rounded-md shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#202020]">
          <div>
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Import Infrastructure (IaC)</h3>
            <p className="text-xs text-[#858585] mt-0.5">
              Safely parse Terraform Plan JSON or Kubernetes Manifests. Zero execution.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#858585] hover:text-[#FFFFFF] p-1 rounded hover:bg-[#1A1A1A] transition-colors"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#858585]">Format Detection:</span>
            <div className="flex gap-1">
              {(["auto", "terraform", "kubernetes"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-2 py-0.5 text-xs font-mono rounded-md border ${
                    selectedFormat === fmt
                      ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF]"
                      : "bg-[#0D0D0D] border-[#202020] text-[#858585]"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <textarea
            placeholder="Paste Terraform plan JSON or Kubernetes YAML manifests here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full bg-[#000000] border border-[#262626] focus:border-[#404040] rounded-md p-3 text-xs font-mono text-[#FFFFFF] placeholder-[#666666] outline-none resize-none"
          />

          <div className="flex justify-end">
            <button
              onClick={handleParse}
              disabled={!content.trim()}
              className="px-3 py-1.5 rounded-md bg-[#141414] border border-[#262626] hover:border-[#404040] disabled:opacity-40 text-xs font-mono text-[#FFFFFF] transition-colors"
            >
              Analyze & Preview
            </button>
          </div>

          {error && (
            <div className="p-2.5 rounded-md bg-[#141414] border border-[#551A1A] text-xs font-mono text-[#FF8080]">
              {error}
            </div>
          )}

          {/* Preview Results */}
          {preview && (
            <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#FFFFFF]">Import Preview</span>
                <span className="text-[11px] font-mono text-[#858585] uppercase">
                  Format: {preview.sourceFormat}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-1">
                <div className="p-2 rounded bg-[#000000] border border-[#202020]">
                  <span className="text-[#858585] block text-[10px]">Total Parsed</span>
                  <span className="text-[#FFFFFF] font-bold text-sm">{preview.totalParsed}</span>
                </div>
                <div className="p-2 rounded bg-[#000000] border border-[#202020]">
                  <span className="text-[#858585] block text-[10px]">New Assets</span>
                  <span className="text-[#FFFFFF] font-bold text-sm">{preview.newResources.length}</span>
                </div>
                <div className="p-2 rounded bg-[#000000] border border-[#202020]">
                  <span className="text-[#858585] block text-[10px]">Redacted Secrets</span>
                  <span className="text-[#FFFFFF] font-bold text-sm">
                    {preview.sensitiveFieldsRedacted}
                  </span>
                </div>
              </div>

              {preview.sensitiveFieldsRedacted > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#858585] font-mono">
                  <ShieldIcon size={12} className="text-[#B5B5B5]" />
                  <span>
                    {preview.sensitiveFieldsRedacted} sensitive credentials/tokens were masked.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-3 border-t border-[#202020] bg-[#080808]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-[#262626] text-xs font-mono text-[#858585] hover:text-[#FFFFFF] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!preview || preview.newResources.length === 0}
            className="px-3 py-1.5 rounded-md bg-[#FFFFFF] border border-[#404040] disabled:opacity-30 text-xs font-mono text-[#000000] font-semibold transition-opacity"
          >
            Apply to Topology
          </button>
        </div>
      </div>
    </div>
  );
}

