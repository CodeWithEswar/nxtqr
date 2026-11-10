import type { FC, SVGProps } from "react";
import { cn } from "@nxtqr/utils";
import { LOGO_GEOMETRY, type LogoColorMode } from "../tokens/branding-tokens";

export interface LogoMarkProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  size?: number | string;
  variant?: "symbol" | "minimal";
  colorMode?: LogoColorMode;
  title?: string;
}

export const LogoMark: FC<LogoMarkProps> = ({
  size = 32,
  variant = "symbol",
  colorMode = "current",
  title,
  children,
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden = !Boolean(ariaLabel || title),
  role = ariaHidden ? "presentation" : "img",
  ...props
}) => {
  const framed = variant === "symbol";
  const { cornerFraming, aperturePath, viewBox, compactViewBox } = LOGO_GEOMETRY;
  const fill =
    colorMode === "current" ? "currentColor" : colorMode === "inverse" ? "#000000" : "#FFFFFF";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={framed ? viewBox : compactViewBox}
      role={role}
      aria-label={ariaLabel || title}
      aria-hidden={ariaHidden}
      className={cn("shrink-0 select-none", className)}
      {...props}
    >
      {title && <title>{title}</title>}
      {children}
      {framed && (
        <path
          d={cornerFraming.combinedPath}
          fill="none"
          stroke={cornerFraming.color}
          strokeWidth={cornerFraming.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <path d={aperturePath} fill={fill} fillRule="evenodd" data-nxtqr-aperture="" />
    </svg>
  );
};

LogoMark.displayName = "LogoMark";
