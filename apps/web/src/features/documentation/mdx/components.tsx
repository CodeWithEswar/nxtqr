import * as React from "react";
import Link from "next/link";
import { cn } from "@nxtqr/utils";
import { CodeBlock } from "../components/code-block";
import { InstallationCommand } from "../components/installation-command";
import { PropsTable } from "../components/props-table";
import { ComponentPreview } from "../components/component-preview";
import { ButtonPlayground } from "../components/component-playground";
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
} from "@nxtqr/ui";

export const mdxComponents = {
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
          "font-semibold text-lg sm:text-xl tracking-tight text-foreground font-sans mt-10 mb-3 border-b border-border pb-2 group flex items-center justify-between",
          className,
        )}
        {...props}
      >
        <span>{children}</span>
        <a
          href={`#${id}`}
          aria-label={`Link to ${text}`}
          className="opacity-0 group-hover:opacity-60 text-muted-foreground font-mono text-xs hover:opacity-100"
        >
          #
        </a>
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
          "font-semibold text-sm sm:text-base tracking-tight text-foreground font-sans mt-6 mb-2 group flex items-center justify-between",
          className,
        )}
        {...props}
      >
        <span>{children}</span>
        <a
          href={`#${id}`}
          aria-label={`Link to ${text}`}
          className="opacity-0 group-hover:opacity-60 text-muted-foreground font-mono text-xs hover:opacity-100"
        >
          #
        </a>
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

  code: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code
      className={cn(
        "font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/60 border border-subtle-border text-foreground font-normal",
        className,
      )}
      {...props}
    />
  ),

  pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) => {
    // If child is a code tag, extract its text content
    const codeContent =
      React.isValidElement(children) &&
      typeof children.props === "object" &&
      children.props !== null &&
      "children" in children.props
        ? String(children.props.children)
        : String(children);
    return <CodeBlock code={codeContent}>{codeContent}</CodeBlock>;
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
  ComponentPlayground: ButtonPlayground,
  ButtonPlayground,
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
};
