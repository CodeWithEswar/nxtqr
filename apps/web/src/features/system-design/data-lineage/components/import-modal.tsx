"use client";

/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * OpenAPI / Lineage Specification Import Modal
 */

import React, { useState } from "react";
import { CloseIcon, DatabaseIcon } from "@nxtqr/icons";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (content: string, sourceComponentId: string, defaultConsumerId: string) => {
    assets: any[];
    flows: any[];
    importedEndpointsCount: number;
    warnings: string[];
  };
}

const SAMPLE_OPENAPI = JSON.stringify(
  {
    openapi: "3.0.3",
    info: { title: "Checkout & Payments API", version: "1.0.0" },
    paths: {
      "/api/v1/orders": {
        post: {
          summary: "Create and authorize order payment",
          operationId: "createOrder",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["customerEmail", "cardNumber", "amount"],
                  properties: {
                    customerEmail: { type: "string", description: "Customer receipt email" },
                    cardNumber: { type: "string", description: "PCI payment card PAN" },
                    billingAddress: { type: "string", description: "Customer billing address" },
                    amount: { type: "number", description: "Charge total in cents" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  null,
  2
);

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  if (!isOpen) return null;

  const [specContent, setSpecContent] = useState(SAMPLE_OPENAPI);
  const [sourceComponentId, setSourceComponentId] = useState("api-gateway");
  const [consumerComponentId, setConsumerComponentId] = useState("web-frontend");
  const [importReport, setImportReport] = useState<{
    assetsCount: number;
    flowsCount: number;
    endpointsCount: number;
    warnings: string[];
  } | null>(null);

  const handleExecuteImport = () => {
    const result = onImport(specContent, sourceComponentId, consumerComponentId);
    setImportReport({
      assetsCount: result.assets.length,
      flowsCount: result.flows.length,
      endpointsCount: result.importedEndpointsCount,
      warnings: result.warnings,
    });
    if (result.assets.length > 0) {
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-none p-4">
      <div className="w-full max-w-xl bg-surface-01 border border-border-default rounded-md shadow-level-2 overflow-hidden space-y-4 p-5 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-default">
          <div className="flex items-center space-x-2">
            <DatabaseIcon className="w-4 h-4 text-text-secondary" />
            <h3 className="text-sm font-semibold text-foreground">
              Import OpenAPI 3.x Specification
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-foreground transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Notice */}
        <div className="p-3 bg-surface-02 border border-border-subtle rounded-md text-text-muted text-[11px]">
          NXTQR will safely extract endpoints, request/response bodies, and map sensitive fields to data assets and flows. No remote network calls or arbitrary code are executed.
        </div>

        {/* Form Controls */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-secondary">
              Hosting Service Component ID
            </label>
            <input
              type="text"
              value={sourceComponentId}
              onChange={(e) => setSourceComponentId(e.target.value)}
              className="w-full bg-surface-02 text-foreground text-xs px-3 py-1.5 rounded-md border border-border-default focus:border-border-strong focus:outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-secondary">
              Consumer / Calling Client ID
            </label>
            <input
              type="text"
              value={consumerComponentId}
              onChange={(e) => setConsumerComponentId(e.target.value)}
              className="w-full bg-surface-02 text-foreground text-xs px-3 py-1.5 rounded-md border border-border-default focus:border-border-strong focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Spec JSON Textarea */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-text-secondary">
              OpenAPI JSON Specification
            </label>
            <button
              onClick={() => setSpecContent(SAMPLE_OPENAPI)}
              className="text-[10px] text-text-muted hover:text-foreground underline"
            >
              Reset to Sample
            </button>
          </div>
          <textarea
            rows={10}
            value={specContent}
            onChange={(e) => setSpecContent(e.target.value)}
            className="w-full bg-surface-02 text-foreground text-xs p-3 rounded-md border border-border-default focus:border-border-strong focus:outline-none font-mono resize-none"
          />
        </div>

        {/* Status / Success / Warning */}
        {importReport && (
          <div className="p-3 bg-surface-03 border border-border-strong rounded-md text-[11px] space-y-1">
            <div className="font-semibold text-foreground">
              Import Completed: {importReport.endpointsCount} endpoints mapped into {importReport.assetsCount} data assets and {importReport.flowsCount} flows.
            </div>
            {importReport.warnings.map((w, idx) => (
              <div key={idx} className="text-text-muted">{w}</div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border-default">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-foreground bg-surface-02 hover:bg-surface-03 border border-border-default rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteImport}
            className="px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-md transition-colors shadow-level-1"
          >
            Import Specification
          </button>
        </div>
      </div>
    </div>
  );
}

