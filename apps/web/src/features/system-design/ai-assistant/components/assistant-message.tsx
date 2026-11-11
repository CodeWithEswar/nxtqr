"use client";

import * as React from "react";
import type { AIMessage, AIArchitectureProposal } from "@nxtqr/architecture-intelligence";
import { ArchitectureReferencePill } from "./architecture-reference-pill";
import { ProposalPreviewCard } from "./proposal-preview-card";
import { CheckIcon } from "@nxtqr/icons";

export interface AssistantMessageProps {
  message: AIMessage;
  isPreviewingProposal?: boolean;
  onToggleProposalPreview?: () => void;
  onApplyProposal?: (proposal: AIArchitectureProposal) => void;
  onSelectNode?: (nodeId: string) => void;
  onSelectEdge?: (edgeId: string) => void;
  className?: string;
}

/**
 * Lightweight, secure markdown parser for structured copilot messages.
 * Sanitizes and handles headers, tables, code blocks, lists, and inline code.
 */
function renderMarkdownContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushCodeBlock = (key: string) => {
    if (codeBlockLines.length === 0) return;
    const code = codeBlockLines.join("\n");
    elements.push(<CodeBlockViewer key={key} code={code} />);
    codeBlockLines = [];
  };

  const flushTable = (key: string) => {
    if (tableRows.length === 0) return;
    elements.push(<MarkdownTableViewer key={key} rows={tableRows} />);
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks (```)
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock(`code_${i}`);
        inCodeBlock = false;
      } else {
        if (inTable) {
          flushTable(`table_${i}`);
          inTable = false;
        }
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Handle markdown table rows (| ... |)
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      // Skip separator rows like | :--- | :--- |
      if (/^\|(\s*[:-]+[-| :]*)\|$/.test(line.trim())) {
        continue;
      }
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      inTable = true;
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable(`table_${i}`);
      inTable = false;
    }

    // Headers
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3_${i}`} className="text-sm font-semibold text-foreground mt-3 mb-1.5 tracking-tight">
          {line.replace("### ", "")}
        </h3>
      );
      continue;
    }
    if (line.startsWith("#### ")) {
      elements.push(
        <h4 key={`h4_${i}`} className="text-xs font-semibold text-secondary uppercase tracking-wider mt-2.5 mb-1">
          {line.replace("#### ", "")}
        </h4>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`bq_${i}`}
          className="border-l-2 border-[#333333] pl-2.5 py-0.5 my-2 text-xs text-muted-foreground italic bg-[#0A0A0A] rounded-r-md"
        >
          {line.replace(/^>\s*(\[!NOTE\]\s*)?/i, "")}
        </blockquote>
      );
      continue;
    }

    // Bulleted list item
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const text = line.trim().replace(/^[-*]\s+/, "");
      elements.push(
        <li key={`li_${i}`} className="text-xs text-foreground/90 ml-3.5 list-disc leading-relaxed my-0.5">
          {renderInlineFormatting(text)}
        </li>
      );
      continue;
    }

    // Standard paragraph or empty line
    if (!line.trim()) {
      elements.push(<div key={`empty_${i}`} className="h-1.5" />);
    } else {
      elements.push(
        <p key={`p_${i}`} className="text-xs text-foreground/90 leading-relaxed my-1">
          {renderInlineFormatting(line)}
        </p>
      );
    }
  }

  if (inCodeBlock) flushCodeBlock("code_end");
  if (inTable) flushTable("table_end");

  return elements;
}

function renderInlineFormatting(text: string): React.ReactNode {
  // Bold **text**
  const boldParts = text.split(/(\*\*.*?\*\*)/g);
  return boldParts.map((bPart, bIdx) => {
    if (bPart.startsWith("**") && bPart.endsWith("**")) {
      return (
        <strong key={bIdx} className="font-semibold text-foreground">
          {renderBackticks(bPart.slice(2, -2))}
        </strong>
      );
    }
    return renderBackticks(bPart);
  });
}

function renderBackticks(text: string): React.ReactNode {
  const parts = text.split(/(`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.2 mx-0.5 font-mono text-[11px] bg-[#141414] border border-[#262626] rounded-md text-foreground/90"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function CodeBlockViewer({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-md border border-[#262626] bg-[#0A0A0A] overflow-hidden my-2 text-xs font-mono">
      <div className="flex items-center justify-between px-3 py-1 bg-[#141414] border-b border-[#202020] text-muted-foreground text-[10px]">
        <span>CODE</span>
        <button
          type="button"
          onClick={handleCopy}
          className="hover:text-foreground transition-colors flex items-center gap-1 focus-visible:outline-none"
        >
          {copied ? <CheckIcon className="w-3 h-3 text-emerald-400" /> : <span>Copy</span>}
        </button>
      </div>
      <div className="p-2.5 overflow-x-auto scrollbar-thin">
        <pre className="text-secondary leading-relaxed">{code}</pre>
      </div>
    </div>
  );
}

function MarkdownTableViewer({ rows }: { rows: string[][] }) {
  if (rows.length === 0) return null;
  const [header, ...bodyRows] = rows;

  return (
    <div className="rounded-md border border-[#262626] overflow-x-auto my-2.5 bg-[#080808]">
      <table className="w-full text-left border-collapse text-xs">
        {header && (
          <thead className="bg-[#141414] border-b border-[#262626] text-muted-foreground font-mono text-[11px]">
            <tr>
              {header.map((col, idx) => (
                <th key={idx} className="p-2 whitespace-nowrap font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-[#1A1A1A]">
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-[#0D0D0D] transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="p-2 text-foreground/90 whitespace-nowrap">
                  {renderInlineFormatting(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AssistantMessage({
  message,
  isPreviewingProposal,
  onToggleProposalPreview,
  onApplyProposal,
  onSelectNode,
  onSelectEdge,
  className = "",
}: AssistantMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex flex-col gap-1.5 my-2.5 ${
        isUser ? "items-end" : "items-start"
      } ${className}`}
    >
      {/* Sender & Timestamp */}
      <div className="flex items-center gap-2 px-1 text-[10px] font-mono text-muted-foreground">
        <span>{isUser ? "YOU" : "NXTQR COPILOT"}</span>
        {message.timestamp && (
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`rounded-md p-3 max-w-[95%] sm:max-w-[85%] text-xs leading-relaxed border transition-colors
          ${
            isUser
              ? "bg-[#1A1A1A] border-[#333333] text-foreground"
              : "bg-[#080808] border-[#262626] text-foreground/90"
          }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div>{renderMarkdownContent(message.content)}</div>
        )}

        {/* Citations / Evidence references */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-2 border-t border-[#1A1A1A]">
            <div className="text-[10px] font-mono text-muted-foreground mb-1.5">
              VERIFIED ARCHITECTURE REFERENCES ({message.citations.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {message.citations.map((cite, idx) => (
                <ArchitectureReferencePill
                  key={`${cite.targetId}_${idx}`}
                  citation={cite}
                  onSelectNode={onSelectNode}
                  onSelectEdge={onSelectEdge}
                />
              ))}
            </div>
          </div>
        )}

        {/* What-If Architecture Proposal Card */}
        {message.proposal && (
          <ProposalPreviewCard
            proposal={message.proposal}
            isPreviewing={isPreviewingProposal}
            onTogglePreview={onToggleProposalPreview}
            onApplyProposal={onApplyProposal}
          />
        )}
      </div>
    </div>
  );
}

