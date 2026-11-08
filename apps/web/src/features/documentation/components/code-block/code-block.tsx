"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@nxtqr/icons";
import { Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { CodeBlockHeader } from "./code-block-header";
import { tokenizeClientCode, type SyntaxToken } from "../../mdx/syntax-highlighting";

export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  code?: string;
  html?: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  collapsible?: boolean;
  maxCollapsedLines?: number;
  wrap?: boolean;
  defaultWrap?: boolean;
  allowWrap?: boolean;
  onWrapChange?: (wrapped: boolean) => void;
}

export function CodeBlock({
  className,
  code,
  html,
  language = "tsx",
  filename,
  showLineNumbers,
  highlightLines = [],
  collapsible,
  maxCollapsedLines = 22,
  wrap,
  defaultWrap,
  allowWrap = true,
  onWrapChange,
  children,
  ...props
}: CodeBlockProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [isWrapped, setIsWrapped] = React.useState(defaultWrap ?? wrap ?? false);

  React.useEffect(() => {
    if (wrap !== undefined) {
      setIsWrapped(wrap);
    }
  }, [wrap]);

  const handleToggleWrap = React.useCallback(() => {
    setIsWrapped((prev) => {
      const next = !prev;
      onWrapChange?.(next);
      return next;
    });
  }, [onWrapChange]);

  // Extract raw text code
  const rawCode =
    code ??
    (typeof children === "string"
      ? children
      : React.Children.toArray(children)
          .map((child) => (typeof child === "string" ? child : ""))
          .join(""));

  const lines = rawCode.trim().split("\n");
  const lineCount = lines.length;

  const shouldCollapse =
    collapsible ?? (lineCount > maxCollapsedLines && !filename?.endsWith(".json"));
  const isLineNumbersEnabled =
    showLineNumbers ?? (lineCount > 3 && language !== "bash" && language !== "shell");

  // Client-side syntax tokenization if no server HTML is provided
  const tokenizedLines = React.useMemo(() => {
    if (html || !rawCode) return null;
    return tokenizeClientCode(rawCode.trim());
  }, [html, rawCode]);

  return (
    <div
      className={cn(
        "relative group my-4 rounded-md border border-border bg-[#0A0A0A] overflow-hidden shadow-level-1",
        isWrapped && "nxtqr-code-wrapped",
        className,
      )}
      data-word-wrap={isWrapped ? "true" : "false"}
      {...props}
    >
      <CodeBlockHeader
        filename={filename}
        language={language}
        code={rawCode}
        isWrapped={isWrapped}
        onToggleWrap={handleToggleWrap}
        allowWrap={allowWrap}
      />

      <div
        className={cn(
          "relative overflow-hidden transition-all duration-200",
          shouldCollapse && !expanded && "max-h-[360px]",
        )}
      >
        {html ? (
          <div
            className={cn(
              "text-xs leading-relaxed transition-all",
              isWrapped
                ? "overflow-x-hidden [word-break:break-word] [overflow-wrap:anywhere]"
                : "overflow-x-auto scrollbar-dense",
            )}
            data-line-numbers={isLineNumbersEnabled ? "" : undefined}
            data-word-wrap={isWrapped ? "true" : undefined}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : tokenizedLines ? (
          <pre
            className={cn(
              "p-4 font-mono text-xs text-foreground/90 leading-relaxed bg-[#000000] transition-all",
              isWrapped
                ? "overflow-x-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                : "overflow-x-auto scrollbar-dense whitespace-pre",
            )}
            data-line-numbers={isLineNumbersEnabled ? "" : undefined}
            data-word-wrap={isWrapped ? "true" : undefined}
          >
            <code className="block">
              {tokenizedLines.map((lineTokens, lineIdx) => {
                const lineNum = lineIdx + 1;
                const isHighlighted = highlightLines.includes(lineNum);
                return (
                  <span
                    key={lineIdx}
                    className={cn(
                      "code-block-line relative block min-h-[1.25rem]",
                      !isLineNumbersEnabled && "px-2",
                      isHighlighted && "highlighted",
                    )}
                  >
                    <span
                      className={cn(
                        "block",
                        isWrapped
                          ? "break-words whitespace-pre-wrap [overflow-wrap:anywhere]"
                          : "whitespace-pre",
                      )}
                    >
                      {lineTokens.map((token, tokenIdx) => (
                        <TokenSpan key={tokenIdx} token={token} />
                      ))}
                    </span>
                  </span>
                );
              })}
            </code>
          </pre>
        ) : (
          <pre
            className={cn(
              "p-4 font-mono text-xs text-foreground/90 leading-relaxed bg-[#000000] transition-all",
              isWrapped
                ? "overflow-x-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                : "overflow-x-auto scrollbar-dense whitespace-pre",
            )}
            data-word-wrap={isWrapped ? "true" : undefined}
          >
            <code>{children ?? rawCode}</code>
          </pre>
        )}

        {/* Collapsed mask when tall */}
        {shouldCollapse && !expanded && (
          <div className="code-block-collapsed-mask" />
        )}
      </div>

      {/* Expand / Collapse Control */}
      {shouldCollapse && (
        <div className="border-t border-border/80 bg-surface/90 px-4 py-2 flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-6 text-[11px] font-mono text-muted-foreground hover:text-foreground gap-1.5"
          >
            {expanded ? (
              <>
                <ChevronUpIcon className="h-3 w-3" />
                <span>Collapse code ({lineCount} lines)</span>
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-3 w-3" />
                <span>Expand full code ({lineCount} lines)</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function TokenSpan({ token }: { token: SyntaxToken }) {
  switch (token.type) {
    case "keyword":
      return <span className="text-[#B388FF] font-medium">{token.text}</span>;
    case "string":
      return <span className="text-[#34D399]">{token.text}</span>;
    case "function":
      return <span className="text-[#FACC15]">{token.text}</span>;
    case "type":
    case "tag":
      return <span className="text-[#60A5FA]">{token.text}</span>;
    case "number":
      return <span className="text-[#FB923C]">{token.text}</span>;
    case "comment":
      return <span className="text-[#737373] italic">{token.text}</span>;
    case "operator":
      return <span className="text-[#A3A3A3]">{token.text}</span>;
    case "plain":
    default:
      return <span className="text-foreground">{token.text}</span>;
  }
}
