import { describe, it, expect } from "vitest";
import { tokenizeJsonLine } from "../components/json-syntax-highlighter";

describe("JsonSyntaxHighlighter Tokenizer", () => {
  it("correctly tokenizes object property keys and string values", () => {
    const line = '  "label": "Object Storage",';
    const tokens = tokenizeJsonLine(line);

    expect(tokens).toEqual([
      { type: "ws", text: "  " },
      { type: "key", text: '"label"' },
      { type: "punctuation", text: ":" },
      { type: "ws", text: " " },
      { type: "string", text: '"Object Storage"' },
      { type: "punctuation", text: "," },
    ]);
  });

  it("handles strings with colons inside without mistaking them for keys", () => {
    const line = '  "endpoint": "https://s3.amazonaws.com:443/bucket",';
    const tokens = tokenizeJsonLine(line);

    expect(tokens[1]).toEqual({ type: "key", text: '"endpoint"' });
    expect(tokens[4]).toEqual({ type: "string", text: '"https://s3.amazonaws.com:443/bucket"' });
  });

  it("correctly tokenizes boolean and number values", () => {
    const line = '  "enabled": true, "count": 5368709120, "rate": -3.14e2,';
    const tokens = tokenizeJsonLine(line);

    const types = tokens.map((t) => t.type);
    expect(types).toContain("boolean");
    expect(types).toContain("number");

    const boolToken = tokens.find((t) => t.text === "true");
    expect(boolToken?.type).toBe("boolean");

    const numToken = tokens.find((t) => t.text === "5368709120");
    expect(numToken?.type).toBe("number");
  });

  it("correctly tokenizes null, brackets, and braces", () => {
    const openBrace = tokenizeJsonLine("{");
    expect(openBrace).toEqual([{ type: "delimiter", text: "{" }]);

    const arrayLine = '  "tags": [';
    const tokens = tokenizeJsonLine(arrayLine);
    expect(tokens.find((t) => t.type === "delimiter")?.text).toBe("[");

    const nullLine = '  "fallback": null';
    const nullTokens = tokenizeJsonLine(nullLine);
    expect(nullTokens.find((t) => t.type === "null")?.text).toBe("null");
  });
});
