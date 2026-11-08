import * as React from "react";
import Link from "next/link";
import { cn } from "@nxtqr/utils";
import { CodeBlock } from "../components/code-block";
import { InstallationCommand } from "../components/installation-command";
import { PropsTable } from "../components/props-table";
import { ComponentPreview } from "../components/component-preview";
import {
  ButtonPlayground,
  BadgePlayground,
  DialogPlayground,
  SwitchPlayground,
  SliderPlayground,
} from "../components/playground/component-playground";
import {
  ComponentDemoView,
  DynamicPlayground,
} from "../components/preview/component-demo-view";
import { slugifyHeading } from "./headings";

// Re-export shared UI components for direct MDX embedded usage
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Textarea,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Switch,
  Slider,
  Separator,
  ScrollArea,
  Toggle,
  ToggleGroup,
  Accordion,
  Collapsible,
  Dialog,
  Select,
  DropdownMenu,
  Popover,
  Progress,
  RadioGroup,
  Sheet,
  Skeleton,
  Tooltip,
  Kbd,
  Calendar,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@nxtqr/ui";

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node) && node.props && (node.props as any).children) {
    return extractText((node.props as any).children);
  }
  return "";
}

export function parseColorValue(text: string): string | null {
  const trimmed = text.trim().replace(/[;,]$/, "");
  // Matches 3, 4, 6, or 8 hex digits (e.g. #000, #000f, #000000, #000000ff)
  if (/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return trimmed;
  }
  // Matches rgb(...) or hsl(...)
  if (
    /^(?:rgb|hsl)a?\(\s*[\d.]+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/i.test(
      trimmed,
    )
  ) {
    return trimmed;
  }
  return null;
}

export interface ColorPreviewProps extends React.HTMLAttributes<HTMLSpanElement> {
  color: string;
  name?: string;
  showCode?: boolean;
}

export function ColorPreview({
  color,
  name,
  showCode = true,
  className,
  ...props
}: ColorPreviewProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded-md bg-surface border border-border shadow-level-1 text-foreground select-all align-middle group",
        className,
      )}
      {...props}
    >
      {name && <span className="font-sans font-medium text-foreground mr-1">{name}</span>}
      {showCode && <span className="text-muted-foreground">{color}</span>}
      <span
        className="relative h-2.5 w-2.5 rounded-[2px] border border-white/25 shadow-[0_0_0_1px_rgba(0,0,0,0.5)] shrink-0 inline-block overflow-hidden select-none group-hover:scale-110 transition-transform"
        aria-hidden="true"
        title={`Color preview: ${color}`}
      >
        <span
          className="absolute inset-0"
          style={{ backgroundColor: color }}
        />
      </span>
    </span>
  );
}

export const mdxComponents = {
  ColorPreview,
  ColorSwatch: ColorPreview,
  h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      className={cn(
        "font-bold text-2xl sm:text-3xl tracking-tight text-foreground font-sans mb-3",
        className,
      )}
      {...props}
    />
  ),

  h2: ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text =
      typeof children === "string" ? children : React.Children.toArray(children).join("");
    const id = slugifyHeading(text);
    return (
      <h2
        id={id}
        className={cn(
          "font-semibold text-lg sm:text-xl tracking-tight text-foreground font-sans mt-10 mb-3 border-b border-border pb-2",
          className,
        )}
        {...props}
      >
        {children}
      </h2>
    );
  },

  h3: ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text =
      typeof children === "string" ? children : React.Children.toArray(children).join("");
    const id = slugifyHeading(text);
    return (
      <h3
        id={id}
        className={cn(
          "font-semibold text-sm sm:text-base tracking-tight text-foreground font-sans mt-6 mb-2",
          className,
        )}
        {...props}
      >
        {children}
      </h3>
    );
  },

  p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      className={cn("text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4", className)}
      {...props}
    />
  ),

  ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className={cn(
        "list-disc list-inside space-y-1.5 text-xs sm:text-sm text-muted-foreground mb-4 pl-2",
        className,
      )}
      {...props}
    />
  ),

  ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className={cn(
        "list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-muted-foreground mb-4 pl-2",
        className,
      )}
      {...props}
    />
  ),

  li: ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className={cn("leading-relaxed", className)} {...props} />
  ),

  code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) => {
    const isBlockCode = typeof className === "string" && className.includes("language-");

    if (!isBlockCode) {
      const rawText = extractText(children);
      const colorValue = parseColorValue(rawText);

      if (colorValue) {
        return (
          <code
            className={cn(
              "font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/60 border border-subtle-border text-foreground font-normal inline-flex items-center gap-1.5 align-middle select-all group",
              className,
            )}
            {...props}
          >
            <span>{children}</span>
            <span
              className="relative h-2.5 w-2.5 rounded-[2px] border border-white/25 shadow-[0_0_0_1px_rgba(0,0,0,0.5)] shrink-0 inline-block overflow-hidden select-none group-hover:scale-110 transition-transform"
              aria-hidden="true"
              title={`Color preview: ${colorValue}`}
            >
              <span
                className="absolute inset-0"
                style={{ backgroundColor: colorValue }}
              />
            </span>
          </code>
        );
      }
    }

    return (
      <code
        className={cn(
          "font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/60 border border-subtle-border text-foreground font-normal",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },

  pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) => {
    let codeContent = "";
    let language = "tsx";
    let filename: string | undefined = undefined;

    if (React.isValidElement(children)) {
      const childProps = children.props as Record<string, any>;
      if (typeof childProps.children === "string") {
        codeContent = childProps.children;
      } else if (Array.isArray(childProps.children)) {
        codeContent = childProps.children
          .map((c) => (typeof c === "string" ? c : ""))
          .join("");
      } else {
        codeContent = String(childProps.children ?? "");
      }

      if (typeof childProps.className === "string") {
        const match = childProps.className.match(/language-([a-zA-Z0-9_-]+)/);
        if (match) {
          language = match[1];
        }
      }

      if (childProps["data-filename"]) {
        filename = String(childProps["data-filename"]);
      }
    } else {
      codeContent = typeof children === "string" ? children : "";
    }

    return (
      <CodeBlock
        code={codeContent}
        language={language}
        filename={filename}
      />
    );
  },

  blockquote: ({ className, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className={cn(
        "my-4 border-l-2 border-accent bg-surface/50 pl-4 py-2 text-xs italic text-muted-foreground rounded-r-md",
        className,
      )}
      {...props}
    />
  ),

  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-4 w-full overflow-x-auto scrollbar-dense rounded-md border border-border bg-surface">
      <table className={cn("w-full text-xs font-sans", className)} {...props} />
    </div>
  ),

  th: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className={cn(
        "border-b border-border bg-secondary-surface p-2.5 text-left font-mono text-[11px] font-semibold text-foreground uppercase tracking-wider",
        className,
      )}
      {...props}
    />
  ),

  td: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className={cn("border-b border-subtle-border p-2.5 text-muted-foreground", className)}
      {...props}
    />
  ),

  a: ({ className, href = "", ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (href.startsWith("/")) {
      return (
        <Link
          href={href}
          className={cn(
            "text-accent underline underline-offset-4 hover:opacity-80 transition-opacity font-medium",
            className,
          )}
          {...props}
        />
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "text-accent underline underline-offset-4 hover:opacity-80 transition-opacity font-medium",
          className,
        )}
        {...props}
      />
    );
  },

  // Interactive documentation platform components
  ComponentPreview,
  ComponentDemoView,
  DynamicPlayground,
  ComponentPlayground: ButtonPlayground,
  ButtonPlayground,
  BadgePlayground,
  DialogPlayground,
  SwitchPlayground,
  SliderPlayground,
  PropsTable,
  InstallationCommand,
  CodeBlock,

  // UI Primitives
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Textarea,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Switch,
  Slider,
  Separator,
  ScrollArea,
  Toggle,
  ToggleGroup,
  Accordion,
  Collapsible,
  Dialog,
  Select,
  DropdownMenu,
  Popover,
  Progress,
  RadioGroup,
  Sheet,
  Skeleton,
  Tooltip,
  Kbd,
  Calendar,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
