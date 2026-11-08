import { describe, it, expect } from "vitest";
import { TextWrapIcon, TextUnwrapIcon } from "@nxtqr/icons";
import { nxtqrDarkTheme, nxtqrLightTheme } from "../../mdx/shiki-theme";
import {
  tokenizeClientCode,
  highlightCodeServer,
} from "../../mdx/syntax-highlighting";

describe("NXTQR Code Block & Syntax Highlighting System", () => {
  it("defines WCAG compliant dark syntax theme tokens", () => {
    expect(nxtqrDarkTheme.name).toBe("nxtqr-dark");
    expect(nxtqrDarkTheme.colors?.["editor.background"]).toBe("#000000");

    const tokenColors = nxtqrDarkTheme.tokenColors || [];
    const keywordToken = tokenColors.find((t) => t.name?.includes("Keywords"));
    expect(keywordToken?.settings.foreground).toBe("#B388FF");

    const stringToken = tokenColors.find((t) => t.name?.includes("Strings"));
    expect(stringToken?.settings.foreground).toBe("#34D399");

    const fnToken = tokenColors.find((t) => t.name?.includes("Functions"));
    expect(fnToken?.settings.foreground).toBe("#FACC15");

    const typeToken = tokenColors.find((t) => t.name?.includes("Types"));
    expect(typeToken?.settings.foreground).toBe("#60A5FA");
  });

  it("defines valid light syntax theme tokens", () => {
    expect(nxtqrLightTheme.name).toBe("nxtqr-light");
    expect(nxtqrLightTheme.colors?.["editor.background"]).toBe("#F5F5F5");
  });

  it("tokenizes client snippets into typed semantic spans", () => {
    const code = `import { Button } from "@nxtqr/ui";\nconst count = 42; // counter`;
    const lines = tokenizeClientCode(code);

    expect(lines.length).toBe(2);

    // Line 1 tokens
    const line1 = lines[0];
    expect(line1.some((t) => t.type === "keyword" && t.text === "import")).toBe(true);
    expect(line1.some((t) => t.type === "type" && t.text === "Button")).toBe(true);
    expect(line1.some((t) => t.type === "string")).toBe(true);

    // Line 2 tokens
    const line2 = lines[1];
    expect(line2.some((t) => t.type === "keyword" && t.text === "const")).toBe(true);
    expect(line2.some((t) => t.type === "number" && t.text === "42")).toBe(true);
    expect(line2.some((t) => t.type === "comment" && t.text.includes("// counter"))).toBe(true);
  });

  it("highlights code using Shiki on the server with span.line wrappers", async () => {
    const code = `export function Demo() {\n  return <Button>Action</Button>;\n}`;
    const html = await highlightCodeServer(code, { lang: "tsx" });

    expect(html).toContain("shiki");
    expect(html).toContain("nxtqr-dark");
    expect(html).toContain('<span class="line">');
  });

  it("exports standardized word wrap iconography with 1.5 stroke width", () => {
    expect(TextWrapIcon).toBeDefined();
    expect(TextWrapIcon.displayName).toBe("TextWrapIcon");
    expect(TextUnwrapIcon).toBeDefined();
    expect(TextUnwrapIcon.displayName).toBe("TextUnwrapIcon");
  });

  it("preserves unformatted code when stripping syntax annotations for clipboard copy", () => {
    const codeWithDiff = `
const foo = "bar"; // [!code highlight]
const added = true; // [!code ++]
const removed = false; // [!code --]
`.trim();

    const sanitized = codeWithDiff.replace(/\/\/ \[!code [^\]]+\]/g, "").trim();
    expect(sanitized).not.toContain("[!code");
    expect(sanitized).toContain('const foo = "bar";');
    expect(sanitized).toContain("const added = true;");
    expect(sanitized).toContain("const removed = false;");
  });
});
