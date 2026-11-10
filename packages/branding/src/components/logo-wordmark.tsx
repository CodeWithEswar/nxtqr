import type { FC, HTMLAttributes } from "react";
import { cn } from "@nxtqr/utils";
import { BRAND_CONSTANTS, type LogoColorMode } from "../tokens/branding-tokens";
import { WORDMARK_TYPOGRAPHY } from "../tokens/typography-fallback";

export interface LogoWordmarkProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  showCategory?: boolean;
  colorMode?: LogoColorMode;
  className?: string;
}

export const LogoWordmark: FC<LogoWordmarkProps> = ({
  size = "md",
  showCategory = true,
  colorMode = "current",
  className,
  ...props
}) => {
  const sizeMap = {
    sm: { title: "text-base tracking-[-0.04em]", category: "text-[9px] tracking-[0.14em]" },
    md: { title: "text-lg tracking-[-0.04em]", category: "text-[10px] tracking-[0.16em]" },
    lg: { title: "text-2xl tracking-[-0.04em]", category: "text-[11px] tracking-[0.16em]" },
    xl: { title: "text-4xl tracking-[-0.05em]", category: "text-xs tracking-[0.18em]" },
  };

  let titleColor = "text-foreground";
  let catColor = "text-muted-foreground";

  if (colorMode === "monochrome") {
    titleColor = "text-white";
    catColor = "text-neutral-400";
  } else if (colorMode === "inverse") {
    titleColor = "text-black";
    catColor = "text-neutral-600";
  }

  return (
    <div
      className={cn("flex flex-col select-none leading-none", className)}
      style={{ fontFamily: WORDMARK_TYPOGRAPHY.fallbackStack }}
      {...props}
    >
      <span
        className={cn(
          "font-bold uppercase leading-none font-sans",
          sizeMap[size].title,
          titleColor,
        )}
        style={{ letterSpacing: WORDMARK_TYPOGRAPHY.letterSpacing }}
      >
        {BRAND_CONSTANTS.name}
      </span>
      {showCategory && (
        <span
          className={cn("font-medium uppercase font-mono mt-0.5", sizeMap[size].category, catColor)}
          style={{
            fontFamily: WORDMARK_TYPOGRAPHY.subtitle.fontFamily,
            letterSpacing: WORDMARK_TYPOGRAPHY.subtitle.letterSpacing,
          }}
        >
          {BRAND_CONSTANTS.category}
        </span>
      )}
    </div>
  );
};

LogoWordmark.displayName = "LogoWordmark";
