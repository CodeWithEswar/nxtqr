"use client";

import * as React from "react";
import { ArchiveIcon, AlertTriangleIcon, CheckIcon } from "@nxtqr/icons";

export interface BenchmarkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (jsonStr: string) => void;
}

const SAMPLE_K6_JSON = `{
  "metrics": {
    "http_req_duration": {
      "values": {
        "p(50)": 32.4,
        "p(90)": 58.1,
        "p(95)": 74.5,
        "p(99)": 128.0,
        "min": 5.2,
        "max": 310.0,
        "avg": 36.8
      }
    },
    "http_reqs": {
      "values": {
        "count": 240000,
        "rate": 1333.3
      }
    },
    "http_req_failed": {
      "values": {
        "count": 28,
        "passes": 28,
        "fails": 239972,
        "rate": 0.000116
      }
    },
    "iterations": {
      "values": {
        "count": 240000,
        "rate": 1333.3
      }
    },
    "dropped_iterations": {
      "values": {
        "count": 4
      }
    }
  },
  "state": {
    "testRunDurationMs": 180000
  }
}`;

export function BenchmarkImportModal({
  isOpen,
  onClose,
  onImport,
}: BenchmarkImportModalProps) {
  const [jsonText, setJsonText] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleValidateAndImport = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.metrics && !parsed.http_req_duration) {
        setError("Invalid benchmark format: Expected k6 summary JSON with 'metrics' object.");
        return;
      }
      setError(null);
      onImport(jsonText);
      onClose();
    } catch {
      setError("Malformed JSON payload: Please verify syntax.");
    }
  };

  const handleLoadSample = () => {
    setJsonText(SAMPLE_K6_JSON);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm select-none p-4">
      <div className="w-full max-w-2xl bg-[#080808] border border-[#262626] rounded-md shadow-level-2 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 bg-[#0D0D0D] border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <ArchiveIcon className="w-4 h-4 text-white" />
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Import Benchmark Result
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-md text-xs font-mono text-[#858585] hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#858585]">
              Paste <code>summary.json</code> exported from k6 or compatible load testing engine:
            </span>
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-2 py-0.5 rounded-md bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-[10px] font-mono text-[#B5B5B5] hover:text-white transition-colors"
            >
              Load Sample k6 JSON
            </button>
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              if (error) setError(null);
            }}
            placeholder='{ "metrics": { "http_req_duration": { ... } } }'
            className="w-full h-64 bg-[#050505] border border-[#262626] rounded-md p-3 font-mono text-[11px] text-white focus:outline-none focus:border-[#404040] resize-none custom-scrollbar"
          />

          {error && (
            <div className="p-2.5 rounded-md bg-red-950/20 border border-red-900/40 text-red-400 text-xs flex items-center gap-2 font-mono">
              <AlertTriangleIcon className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0D0D0D] border-t border-[#262626] flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#666666]">
            Strict provenance tracking: Normalized metrics tagged as 'measured'
          </span>

          <button
            type="button"
            disabled={!jsonText.trim()}
            onClick={handleValidateAndImport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#262626] hover:bg-[#333333] disabled:opacity-50 border border-[#404040] text-xs font-mono text-white transition-colors"
          >
            <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
            Import &amp; Analyze Run
          </button>
        </div>
      </div>
    </div>
  );
}
