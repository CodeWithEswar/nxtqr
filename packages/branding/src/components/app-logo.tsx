import type { FC, AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@nxtqr/utils";
import { LogoMark } from "./logo-mark";
import { LogoWordmark } from "./logo-wordmark";
import { AnimatedLogo } from "./animated-logo";
import type { LogoVariant, LogoColorMode } from "../tokens/branding-tokens";

export interface AppLogoProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  variant?: LogoVariant;
  size?: number | string;
  colorMode?: LogoColorMode;
  animated?: boolean;
  animationMode?: "entrance" | "loading" | "interactive";
  showCategory?: boolean;
  className?: string;
  title?: string;
  href?: string;
}

export const AppLogo: FC<AppLogoProps> = ({
  variant = "full",
  size = 32,
  colorMode = "current",
  animated = false,
  animationMode = "entrance",
  showCategory = true,
  className,
  title = "NXTQR",
  href,
  ...props
}) => {
  const numericSize = typeof size === "number" ? size : parseInt(size as string, 10) || 32;

  // Determine wordmark size based on logo size
  const wordmarkSize =
    numericSize <= 24 ? "sm" : numericSize <= 40 ? "md" : numericSize <= 56 ? "lg" : "xl";

  const renderMark = (isMinimal = false) => {
    if (animated) {
      return (
        <AnimatedLogo
          size={size}
          variant={isMinimal ? "minimal" : "symbol"}
          colorMode={colorMode}
          mode={animationMode}
          title={title}
        />
      );
    }
    return (
      <LogoMark
        size={size}
        variant={isMinimal ? "minimal" : "symbol"}
        colorMode={colorMode}
        title={title}
      />
    );
  };

  let content: ReactNode = null;

  switch (variant) {
    case "symbol":
      content = renderMark(false);
      break;
    case "minimal":
      content = renderMark(true);
      break;
    case "wordmark":
      content = (
        <LogoWordmark size={wordmarkSize} showCategory={showCategory} colorMode={colorMode} />
      );
      break;
    case "stacked":
      content = (
        <div className="flex flex-col items-center gap-2 text-center">
          {renderMark(false)}
          <LogoWordmark
            size={wordmarkSize}
            showCategory={showCategory}
            colorMode={colorMode}
            className="items-center"
          />
        </div>
      );
      break;
    case "full":
    default:
      content = (
        <div className="inline-flex items-center gap-2.5">
          {renderMark(false)}
          <LogoWordmark size={wordmarkSize} showCategory={showCategory} colorMode={colorMode} />
        </div>
      );
      break;
  }

  if (href) {
    return (
      <a
        href={href}
        className={cn(
          "inline-flex items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md transition-opacity hover:opacity-90",
          className,
        )}
        title={title}
        aria-label={title}
        {...props}
      >
        {content}
      </a>
    );
  }

  return <div className={cn("inline-flex items-center", className)}>{content}</div>;
};

AppLogo.displayName = "AppLogo";
