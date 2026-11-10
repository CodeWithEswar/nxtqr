import { createHighlighter, type Highlighter } from "shiki";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationFocus,
  transformerMetaHighlight,
} from "@shikijs/transformers";
import { nxtqrDarkTheme, nxtqrLightTheme } from "./shiki-theme";

let highlighterPromise: Promise<Highlighter> | null = null;

export async function getShikiHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [nxtqrDarkTheme, nxtqrLightTheme],
      langs: [
        "typescript",
        "tsx",
        "javascript",
        "jsx",
        "json",
        "css",
        "scss",
        "html",
        "bash",
        "shell",
        "sql",
        "yaml",
        "markdown",
        "python",
        "go",
        "rust",
      ],
    });
  }
  return highlighterPromise;
}

export interface HighlightOptions {
  lang?: string;
  theme?: "dark" | "light";
  lineNumbers?: boolean;
  highlightLines?: number[];
}

/**
 * Server-side Shiki syntax highlighter
 */
export async function highlightCodeServer(
  code: string,
  options: HighlightOptions = {},
): Promise<string> {
  const { lang = "tsx", theme = "dark" } = options;
  const themeName = theme === "dark" ? "nxtqr-dark" : "nxtqr-light";

  try {
    const highlighter = await getShikiHighlighter();
    const effectiveLang = highlighter.getLoadedLanguages().includes(lang) ? lang : "tsx";

    return highlighter.codeToHtml(code.trim(), {
      lang: effectiveLang,
      theme: themeName,
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        transformerNotationFocus(),
        transformerMetaHighlight(),
      ],
    });
  } catch (error) {
    console.warn("Failed to highlight with Shiki, falling back to plain HTML:", error);
    return `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface SyntaxToken {
  type:
    | "keyword"
    | "string"
    | "function"
    | "type"
    | "tag"
    | "number"
    | "comment"
    | "operator"
    | "plain";
  text: string;
}

/**
 * Fast, zero-dependency client tokenizer for dynamic interactive playgrounds.
 * Matches the official NXTQR syntax palette with zero client bundle overhead.
 */
export function tokenizeClientCode(code: string): SyntaxToken[][] {
  const lines = code.split("\n");

  return lines.map((line) => {
    const tokens: SyntaxToken[] = [];
    let remaining = line;

    while (remaining.length > 0) {
      // 1. Comments
      const commentMatch = remaining.match(/^(\/\/.*)$/);
      if (commentMatch) {
        tokens.push({ type: "comment", text: commentMatch[1] });
        break;
      }

      // 2. Object property keys (JSON and JS object literals): "key":
      const propKeyMatch = remaining.match(/^("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")\s*(:)/);
      if (propKeyMatch) {
        tokens.push({ type: "type", text: propKeyMatch[1] });
        tokens.push({ type: "operator", text: ":" });
        remaining = remaining.slice(propKeyMatch[0].length);
        continue;
      }

      // 3. Strings
      const stringMatch = remaining.match(/^("[^"]*"|'[^']*'|`[^`]*`)/);
      if (stringMatch) {
        tokens.push({ type: "string", text: stringMatch[1] });
        remaining = remaining.slice(stringMatch[0].length);
        continue;
      }

      // 3. Keywords
      const keywordMatch = remaining.match(
        /^(import|from|export|default|const|let|var|function|return|if|else|switch|case|break|try|catch|finally|async|await|type|interface|class|extends|implements|as|new|typeof|instanceof)\b/,
      );
      if (keywordMatch) {
        tokens.push({ type: "keyword", text: keywordMatch[1] });
        remaining = remaining.slice(keywordMatch[0].length);
        continue;
      }

      // 4. Numbers & Booleans
      const numMatch = remaining.match(/^(true|false|null|undefined|\d+(\.\d+)?)\b/);
      if (numMatch) {
        tokens.push({ type: "number", text: numMatch[1] });
        remaining = remaining.slice(numMatch[0].length);
        continue;
      }

      // 5. JSX Tags & Elements
      const tagMatch = remaining.match(/^(<\/?[a-zA-Z0-9_-]+|>|\/>)/);
      if (tagMatch) {
        tokens.push({ type: "tag", text: tagMatch[1] });
        remaining = remaining.slice(tagMatch[0].length);
        continue;
      }

      // 6. Types & PascalCase Identifiers (e.g. Button, React, StateProps)
      const typeMatch = remaining.match(/^([A-Z][a-zA-Z0-9_$]*)\b/);
      if (typeMatch) {
        tokens.push({ type: "type", text: typeMatch[1] });
        remaining = remaining.slice(typeMatch[0].length);
        continue;
      }

      // 7. Functions
      const fnMatch = remaining.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\()/);
      if (fnMatch) {
        tokens.push({ type: "function", text: fnMatch[1] });
        remaining = remaining.slice(fnMatch[0].length);
        continue;
      }

      // 8. Operators & Delimiters
      const opMatch = remaining.match(/^([=+\-*/%&|!<>?:;,{}()[\]]+)/);
      if (opMatch) {
        tokens.push({ type: "operator", text: opMatch[1] });
        remaining = remaining.slice(opMatch[0].length);
        continue;
      }

      // 8. Plain words / whitespace
      const plainMatch = remaining.match(/^([a-zA-Z0-9_$]+|\s+)/);
      if (plainMatch) {
        tokens.push({ type: "plain", text: plainMatch[1] });
        remaining = remaining.slice(plainMatch[0].length);
        continue;
      }

      // Fallback single char
      tokens.push({ type: "plain", text: remaining[0] });
      remaining = remaining.slice(1);
    }

    return tokens;
  });
}
