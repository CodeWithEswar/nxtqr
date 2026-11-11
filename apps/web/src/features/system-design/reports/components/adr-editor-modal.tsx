"use client";

import React, { useState } from "react";
import type { ArchitectureDecisionRecord, ADRStatus } from "@nxtqr/architecture-intelligence";
import { CloseIcon } from "@nxtqr/icons";

interface ADREditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (adr: ArchitectureDecisionRecord) => void;
  nextDecisionNumber: number;
}

export function ADREditorModal({
  isOpen,
  onClose,
  onSave,
  nextDecisionNumber,
}: ADREditorModalProps) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<ADRStatus>("accepted");
  const [context, setContext] = useState("");
  const [decision, setDecision] = useState("");
  const [positiveConsequences, setPositiveConsequences] = useState("");
  const [negativeConsequences, setNegativeConsequences] = useState("");
  const [author, setAuthor] = useState("Lead Systems Architect");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !decision.trim()) return;

    const newAdr: ArchitectureDecisionRecord = {
      id: `adr-${String(nextDecisionNumber).padStart(4, "0")}`,
      decisionNumber: nextDecisionNumber,
      title: title.trim(),
      status,
      context: context.trim() || "Architectural requirement under evaluation.",
      decision: decision.trim(),
      consequences: {
        positive: positiveConsequences
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        negative: negativeConsequences
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      },
      alternativesConsidered: [],
      relatedComponentIds: [],
      relatedFindingIds: [],
      date: new Date().toISOString().split("T")[0],
      author: author.trim() || "Lead Systems Architect",
    };

    onSave(newAdr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-xl rounded-md border border-[#262626] bg-[#080808] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262626] p-4 bg-[#0D0D0D]">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Log Architecture Decision Record (ADR-{String(nextDecisionNumber).padStart(4, "0")})
            </h3>
            <p className="text-xs text-[#858585] mt-0.5">
              Record immutable engineering rationale, context, and structural trade-offs.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#1A1A1A] text-[#858585] hover:text-white transition-colors"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-[#B5B5B5]">
          <div>
            <label className="block text-[11px] font-mono text-[#858585] mb-1 uppercase tracking-wider">
              Decision Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Adopt Event-Driven Outbox Pattern for Payment Transactions"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] rounded-md py-2 px-3 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-[#404040]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-[#858585] mb-1 uppercase tracking-wider">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ADRStatus)}
                className="w-full bg-[#141414] border border-[#262626] rounded-md py-1.5 px-2 text-xs text-white focus:outline-none focus:border-[#404040]"
              >
                <option value="proposed">PROPOSED</option>
                <option value="accepted">ACCEPTED</option>
                <option value="superseded">SUPERSEDED</option>
                <option value="deprecated">DEPRECATED</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono text-[#858585] mb-1 uppercase tracking-wider">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-[#141414] border border-[#262626] rounded-md py-1.5 px-2 text-xs text-white focus:outline-none focus:border-[#404040]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#858585] mb-1 uppercase tracking-wider">
              Context & Problem Statement
            </label>
            <textarea
              rows={2}
              placeholder="What forces or constraints require an architectural decision?"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] rounded-md p-2 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-[#404040]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#858585] mb-1 uppercase tracking-wider">
              Decision
            </label>
            <textarea
              rows={2}
              required
              placeholder="What technical approach or policy was chosen?"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] rounded-md p-2 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-[#404040]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-[#858585] mb-1 uppercase tracking-wider">
                Positive Consequences (One per line)
              </label>
              <textarea
                rows={2}
                placeholder="Guaranteed at-least-once delivery&#10;Decoupled compute services"
                value={positiveConsequences}
                onChange={(e) => setPositiveConsequences(e.target.value)}
                className="w-full bg-[#141414] border border-[#262626] rounded-md p-2 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-[#404040]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-[#858585] mb-1 uppercase tracking-wider">
                Negative Consequences (One per line)
              </label>
              <textarea
                rows={2}
                placeholder="Additional polling worker needed&#10;Potential message deduplication required"
                value={negativeConsequences}
                onChange={(e) => setNegativeConsequences(e.target.value)}
                className="w-full bg-[#141414] border border-[#262626] rounded-md p-2 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-[#404040]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1A1A1A]">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3 rounded-md text-xs text-[#858585] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-1.5 px-4 rounded-md bg-[#1A1A1A] border border-[#404040] hover:bg-[#262626] text-xs font-medium text-white transition-colors"
            >
              Save Decision Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
