"use client";

import React, { useState } from "react";
import type {
  ArchitectureReport,
  ReportExportFormat,
  ReportExportOptions,
  ReportPageOrientation,
  ReportPageSize,
} from "@nxtqr/architecture-intelligence";
import { CloseIcon, CopyIcon, CheckIcon } from "@nxtqr/icons";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  report: ArchitectureReport;
  onExport: (options: ReportExportOptions) => {
    format: ReportExportFormat;
    content: string;
    filename: string;
    mimeType: string;
    byteSize: number;
  };
}

export function ExportDialog({ isOpen, onClose, report, onExport }: ExportDialogProps) {
  const [format, setFormat] = useState<ReportExportFormat>("markdown");
  const [pageSize, setPageSize] = useState<ReportPageSize>("a4");
  const [orientation, setOrientation] = useState<ReportPageOrientation>("portrait");
  const [customWatermark, setCustomWatermark] = useState<string>("");
  const [includeCoverPage, setIncludeCoverPage] = useState<boolean>(true);
  const [includeTableOfContents, setIncludeTableOfContents] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const result = onExport({
      format,
      pageSize,
      orientation,
      customWatermark: customWatermark.trim() || undefined,
      includeCoverPage,
      includeTableOfContents,
    });

    const blob = new Blob([result.content], { type: result.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const result = onExport({
      format,
      pageSize,
      orientation,
      customWatermark: customWatermark.trim() || undefined,
      includeCoverPage,
      includeTableOfContents,
    });

    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-md border border-[#262626] bg-[#080808] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262626] p-4 bg-[#0D0D0D]">
          <div>
            <h3 className="text-sm font-semibold text-white">Export Architecture Report</h3>
            <p className="text-xs text-[#858585] mt-0.5">{report.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#1A1A1A] text-[#858585] hover:text-white transition-colors"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-[#B5B5B5]">
          {/* Format Picker */}
          <div>
            <label className="block text-xs font-mono text-[#858585] mb-2 uppercase tracking-wider">
              Export Format
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(["markdown", "pdf", "html", "json", "docx"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`py-2 px-3 rounded-md font-mono text-xs uppercase border text-center transition-colors ${
                    format === fmt
                      ? "bg-[#1A1A1A] border-[#404040] text-white font-medium"
                      : "bg-[#0D0D0D] border-[#1A1A1A] hover:border-[#333333] text-[#858585] hover:text-[#B5B5B5]"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* PDF/Print Layout Options */}
          {(format === "pdf" || format === "html") && (
            <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] space-y-3">
              <span className="block font-medium text-white">Document Geometry & Layout</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#858585] mb-1">Page Size</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as ReportPageSize)}
                    className="w-full bg-[#141414] border border-[#262626] rounded-md py-1.5 px-2 text-xs text-white focus:outline-none focus:border-[#404040]"
                  >
                    <option value="a4">A4 (210 x 297 mm)</option>
                    <option value="letter">US Letter (8.5 x 11 in)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[#858585] mb-1">Orientation</label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as ReportPageOrientation)}
                    className="w-full bg-[#141414] border border-[#262626] rounded-md py-1.5 px-2 text-xs text-white focus:outline-none focus:border-[#404040]"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#858585] mb-1">Optional Watermark</label>
                <input
                  type="text"
                  placeholder="e.g. CONFIDENTIAL / DRAFT"
                  value={customWatermark}
                  onChange={(e) => setCustomWatermark(e.target.value)}
                  className="w-full bg-[#141414] border border-[#262626] rounded-md py-1.5 px-2 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-[#404040]"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCoverPage}
                    onChange={(e) => setIncludeCoverPage(e.target.checked)}
                    className="rounded bg-[#141414] border-[#262626]"
                  />
                  <span>Include Cover Page</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTableOfContents}
                    onChange={(e) => setIncludeTableOfContents(e.target.checked)}
                    className="rounded bg-[#141414] border-[#262626]"
                  />
                  <span>Table of Contents</span>
                </label>
              </div>
            </div>
          )}

          {/* Format Characteristics */}
          <div className="text-[11px] text-[#858585] p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
            {format === "markdown" && (
              <p>Generates clean, GitHub-Flavored Markdown with YAML frontmatter, tables, and ADR sections.</p>
            )}
            {format === "pdf" && (
              <p>Formats print-optimized vector layout with @page margin boxes, headers, footers, and page-breaks.</p>
            )}
            {format === "html" && (
              <p>Produces standalone, self-contained HTML with Pure Black Studio typography and responsive tables.</p>
            )}
            {format === "json" && (
              <p>Exports complete, schema-validated normalized document model for programmatic ingestion.</p>
            )}
            {format === "docx" && (
              <p>Generates structured WordprocessingML XML for Microsoft Word and Google Docs.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#262626] p-4 bg-[#0D0D0D]">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 py-1.5 px-3 rounded-md bg-[#141414] border border-[#262626] hover:border-[#404040] text-xs text-[#B5B5B5] hover:text-white transition-colors"
          >
            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
            <span>{copied ? "Copied" : "Copy Content"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3 rounded-md text-xs text-[#858585] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="py-1.5 px-4 rounded-md bg-[#1A1A1A] border border-[#404040] hover:bg-[#262626] text-xs font-medium text-white transition-colors"
            >
              Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
