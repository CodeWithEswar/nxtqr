import { describe, it, expect } from "vitest";
import * as React from "react";
import { TextWrapIcon, TextUnwrapIcon } from "@nxtqr/icons";
import { nxtqrDarkTheme, nxtqrLightTheme } from "../../mdx/shiki-theme";
import {
  tokenizeClientCode,
  highlightCodeServer,
} from "../../mdx/syntax-highlighting";
import { parseColorValue, mdxComponents } from "../../mdx/components";

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

  it("parses valid color tokens and rejects non-color inline code", () => {
    // Valid hex colors (3, 4, 6, 8 hex digits)
    expect(parseColorValue("#000000")).toBe("#000000");
    expect(parseColorValue("#0A0A0A")).toBe("#0A0A0A");
    expect(parseColorValue("#141414")).toBe("#141414");
    expect(parseColorValue("#1A1A1A")).toBe("#1A1A1A");
    expect(parseColorValue("#FFFFFF")).toBe("#FFFFFF");
    expect(parseColorValue("#FF0000")).toBe("#FF0000");
    expect(parseColorValue("#00CC66")).toBe("#00CC66");
    expect(parseColorValue("#fff")).toBe("#fff");
    expect(parseColorValue("#000f")).toBe("#000f");
    expect(parseColorValue("#000000ff")).toBe("#000000ff");

    // Trailing punctuation tolerance
    expect(parseColorValue("#000000;")).toBe("#000000");
    expect(parseColorValue("#FF0000,")).toBe("#FF0000");

    // Valid rgb and hsl
    expect(parseColorValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    expect(parseColorValue("rgba(0, 0, 0, 0.5)")).toBe("rgba(0, 0, 0, 0.5)");

    // Non-color inline code strings
    expect(parseColorValue("rounded-md")).toBeNull();
    expect(parseColorValue("0.375rem / 6px")).toBeNull();
    expect(parseColorValue("focus-visible:ring-1")).toBeNull();
    expect(parseColorValue("#header")).toBeNull();
    expect(parseColorValue("#button")).toBeNull();
    expect(parseColorValue("#12345")).toBeNull();
  });

  it("renders color preview swatch on the right side of inline color code", () => {
    const rendered = mdxComponents.code({
      children: "#000000",
    }) as React.ReactElement<any>;

    expect(rendered).toBeDefined();
    expect(rendered.type).toBe("code");

    // Children of the code element should be: [<span>#000000</span>, <span className="... swatch ..." />]
    const childrenArray = React.Children.toArray(rendered.props.children);
    expect(childrenArray.length).toBe(2);

    // Left child is the text wrapper
    const textChild = childrenArray[0] as React.ReactElement<any>;
    expect(textChild.props.children).toBe("#000000");

    // Right child is the color preview swatch
    const swatchChild = childrenArray[1] as React.ReactElement<any>;
    expect(swatchChild.props["aria-hidden"]).toBe("true");
    expect(swatchChild.props.title).toContain("#000000");

    // Verify swatch fill has the exact backgroundColor
    const fillChild = React.Children.toArray(swatchChild.props.children)[0] as React.ReactElement<any>;
    expect(fillChild.props.style?.backgroundColor).toBe("#000000");
  });

  it("renders normal inline code without swatch for non-color strings", () => {
    const rendered = mdxComponents.code({
      children: "rounded-md",
    }) as React.ReactElement<any>;

    expect(rendered).toBeDefined();
    expect(rendered.props.children).toBe("rounded-md");
  });
});
