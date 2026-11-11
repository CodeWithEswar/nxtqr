"use client";

import * as React from "react";
import { Button } from "@nxtqr/ui";

export interface AssistantComposerProps {
  onSendMessage: (content: string) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const PRESET_QUICK_PROMPTS = [
  { label: "Trace SPOFs", prompt: "Identify single points of failure in this architecture and calculate their blast radius." },
  { label: "Check Bottlenecks", prompt: "Which components in this system have high contention or throughput bottlenecks?" },
  { label: "Propose Cache Tier", prompt: "Can you propose and insert a distributed Redis cache to offload read load from the database?" },
  { label: "Security Review", prompt: "Examine trust boundary crossings and unencrypted database connections in this topology." },
];

export function AssistantComposer({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  disabled = false,
  placeholder = "Ask about your architecture or request a proposal... (Enter to send)",
  className = "",
}: AssistantComposerProps) {
  const [input, setInput] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() || isStreaming || disabled) return;
    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    onSendMessage(prompt);
  };

  return (
    <div className={`flex flex-col gap-2 p-3 bg-[#080808] border-t border-[#1A1A1A] ${className}`}>
      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
        <span className="text-[10px] font-mono text-muted-foreground uppercase shrink-0">Prompts:</span>
        {PRESET_QUICK_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isStreaming || disabled}
            onClick={() => handlePromptClick(item.prompt)}
            className="text-[11px] whitespace-nowrap px-2 py-0.5 rounded-md bg-[#141414] hover:bg-[#1A1A1A]
              border border-[#262626] hover:border-[#333333] text-secondary hover:text-foreground transition-colors
              disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Input Box and Actions */}
      <div className="relative rounded-md border border-[#262626] focus-within:border-[#404040] focus-within:ring-1 focus-within:ring-[#333333] bg-[#0D0D0D] transition-colors">
        <textarea
          ref={textareaRef}
          rows={2}
          value={input}
          disabled={disabled}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={4000}
          className="w-full bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground
            resize-none focus:outline-none scrollbar-thin"
        />

        <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-[#1A1A1A] text-[10px] text-muted-foreground">
          <span className="font-mono">{input.length} / 4000 chars</span>

          <div className="flex items-center gap-2">
            {isStreaming ? (
              <Button
                type="button"
                size="sm"
                onClick={onStopStreaming}
                className="h-6 px-2.5 rounded-md text-[11px] bg-red-950/40 border border-red-900/60 text-red-400 hover:bg-red-950/60"
              >
                Stop
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={!input.trim() || disabled}
                onClick={handleSend}
                className="h-6 px-3 rounded-md text-[11px] bg-[#1A1A1A] hover:bg-[#262626] border border-[#333333] text-foreground font-mono disabled:opacity-40"
              >
                Send ↵
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

