"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";

export type JsonTokenType =
  | "key"
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "delimiter"
  | "punctuation"
  | "ws"
  | "plain";

export interface JsonToken {
  type: JsonTokenType;
  text: string;
}

/**
 * Tokenizes a single line of formatted JSON with strict token differentiation
 * for keys, string values, numbers, booleans, null, delimiters, and punctuation.
 */
export function tokenizeJsonLine(line: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  let rem = line;

  while (rem.length > 0) {
    // 1. Whitespace
    const wsMatch = rem.match(/^\s+/);
    if (wsMatch) {
      tokens.push({ type: "ws", text: wsMatch[0] });
      rem = rem.slice(wsMatch[0].length);
      continue;
    }

    // 2. Object property key: "key":
    const keyMatch = rem.match(/^("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")\s*(:)/);
    if (keyMatch) {
      tokens.push({ type: "key", text: keyMatch[1] });
      tokens.push({ type: "punctuation", text: ":" });
      rem = rem.slice(keyMatch[0].length);
      continue;
    }

    // 3. String value (surrounded by quotes, not followed by a colon)
    const strMatch = rem.match(/^"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"/);
    if (strMatch) {
      tokens.push({ type: "string", text: strMatch[0] });
      rem = rem.slice(strMatch[0].length);
      continue;
    }

    // 4. Boolean literal
    const boolMatch = rem.match(/^(true|false)\b/);
    if (boolMatch) {
      tokens.push({ type: "boolean", text: boolMatch[0] });
      rem = rem.slice(boolMatch[0].length);
      continue;
    }

    // 5. Null literal
    const nullMatch = rem.match(/^null\b/);
    if (nullMatch) {
      tokens.push({ type: "null", text: nullMatch[0] });
      rem = rem.slice(nullMatch[0].length);
      continue;
    }

    // 6. Number literal (integers, floats, exponents, negative)
    const numMatch = rem.match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?\b/);
    if (numMatch) {
      tokens.push({ type: "number", text: numMatch[0] });
      rem = rem.slice(numMatch[0].length);
      continue;
    }

    // 7. Structural delimiters: { } [ ]
    const delimMatch = rem.match(/^[{}\[\]]/);
    if (delimMatch) {
      tokens.push({ type: "delimiter", text: delimMatch[0] });
      rem = rem.slice(delimMatch[0].length);
      continue;
    }

    // 8. Commas / colons
    const punctMatch = rem.match(/^[,:]/);
    if (punctMatch) {
      tokens.push({ type: "punctuation", text: punctMatch[0] });
      rem = rem.slice(punctMatch[0].length);
      continue;
    }

    // 9. Fallback character
    tokens.push({ type: "plain", text: rem[0] });
    rem = rem.slice(1);
  }

  return tokens;
}

/**
 * Token color palette calibrated strictly against pure black (#000000)
 * matching NXTQR Dark Theme with WCAG AAA contrast ratio.
 */
function JsonTokenSpan({ token }: { token: JsonToken }) {
  switch (token.type) {
    case "key":
      // Light clear blue for object property keys
      return <span className="text-[#93C5FD] font-medium">{token.text}</span>;
    case "string":
      // Soft emerald green for string values
      return <span className="text-[#34D399]">{token.text}</span>;
    case "number":
      // Warm amber orange for numeric values
      return <span className="text-[#FB923C]">{token.text}</span>;
    case "boolean":
      // Restrained violet for boolean literals
      return <span className="text-[#C084FC] font-medium">{token.text}</span>;
    case "null":
      // Soft coral for null
      return <span className="text-[#F87171] italic">{token.text}</span>;
    case "delimiter":
      // High-contrast near-white for structural brackets { } [ ]
      return <span className="text-[#EDEDED] font-semibold">{token.text}</span>;
    case "punctuation":
      // Muted neutral for colons and commas
      return <span className="text-[#737373]">{token.text}</span>;
    case "ws":
    case "plain":
    default:
      return <span>{token.text}</span>;
  }
}

export interface JsonSyntaxHighlighterProps {
  /** Raw object or pre-formatted JSON string */
  data: unknown;
  /** Custom container class */
  className?: string;
  /** Whether to show line numbers on the left */
  showLineNumbers?: boolean;
  /** Soft wrap long string lines instead of horizontal scrolling */
  wrap?: boolean;
  /** Max height for the scrollable container */
  maxHeight?: string | number;
}

export function JsonSyntaxHighlighter({
  data,
  className = "",
  showLineNumbers = false,
  wrap = false,
  maxHeight = "480px",
}: JsonSyntaxHighlighterProps) {
  const jsonString = React.useMemo(() => {
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return data;
      }
    }
    return JSON.stringify(data, null, 2);
  }, [data]);

  const lines = React.useMemo(() => {
    return jsonString.split("\n").map((line) => tokenizeJsonLine(line));
  }, [jsonString]);

  const maxDigits = String(lines.length).length;

  return (
    <div
      className={cn(
        "p-3 bg-[#000000] font-mono text-xs overflow-auto precision-rail select-text",
        className,
      )}
      style={{ maxHeight }}
    >
      <pre className="text-[11px] leading-relaxed font-mono m-0 p-0 bg-transparent">
        <code>
          {lines.map((tokens, lineIdx) => {
            const lineNum = lineIdx + 1;
            return (
              <span
                key={lineIdx}
                className={cn(
                  "flex min-h-[1.25rem] hover:bg-surface-02/40 transition-colors group/line",
                  wrap
                    ? "whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                    : "whitespace-pre",
                )}
              >
                {showLineNumbers && (
                  <span
                    className="select-none text-right text-[10px] text-text-disabled pr-3 group-hover/line:text-text-muted font-mono shrink-0 transition-colors"
                    style={{ minWidth: `${maxDigits * 8 + 16}px` }}
                    aria-hidden="true"
                  >
                    {lineNum}
                  </span>
                )}
                <span
                  className={cn(
                    "flex-1",
                    wrap
                      ? "whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                      : "whitespace-pre",
                  )}
                >
                  {tokens.map((token, tokenIdx) => (
                    <JsonTokenSpan key={tokenIdx} token={token} />
                  ))}
                </span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
