import type { FC, SVGProps } from "react";
import { cn } from "@nxtqr/utils";
import { LOGO_GEOMETRY } from "../tokens/branding-tokens";
import { getSvgGradients, getMonogramMarkup } from "../utils/svg-paths";

export interface AppIconProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  size?: number | string;
  type?: "hero" | "black" | "white" | "red" | "accent";
  accentColor?: string;
  className?: string;
  title?: string;
  "aria-label"?: string;
}

/**
 * AppIcon renders the complete signature app icon tile matching the reference design.
 * Supports:
 * - "hero": Large illuminated tile with atmospheric concentric rings and full-width laser flare
 * - "black": Dark squircle tile with white brackets and liquid chrome monogram
 * - "white": Pure white squircle tile with deep charcoal brackets
 * - "red" | "accent": User-selected pure accent colored squircle tile
 */
export const AppIcon: FC<AppIconProps> = ({
  size = 64,
  type = "black",
  accentColor = "var(--accent, #FF0000)",
  className,
  title,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHiddenProp,
  role: roleProp,
  ...props
}) => {
  const hasLabel = Boolean(ariaLabel || title);
  const isHidden = ariaHiddenProp ?? !hasLabel;
  const role = roleProp ?? (isHidden ? "presentation" : "img");
  const isInverse = type === "white";

  if (type === "hero") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role={role}
        aria-label={ariaLabel || title}
        aria-hidden={isHidden}
        className={cn("shrink-0 select-none", className)}
        {...props}
      >
        {title && <title>{title}</title>}
        <defs>
          <radialGradient id="appIconSquircleBody" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#161616" />
            <stop offset="55%" stopColor="#0A0A0A" />
            <stop offset="100%" stopColor="#010101" />
          </radialGradient>
          <linearGradient id="appIconHeroLaser" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0" />
            <stop offset="25%" stopColor={accentColor} stopOpacity="0.85" />
            <stop offset="47%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="53%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="75%" stopColor={accentColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </linearGradient>
          <radialGradient id="appIconHeroFlare" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="20%" stopColor={accentColor} stopOpacity="0.95" />
            <stop offset="55%" stopColor={accentColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Rings */}
        <circle
          cx="128"
          cy="128"
          r="122"
          stroke="#161616"
          strokeWidth="1.2"
          fill="none"
          opacity="0.6"
        />
        <circle
          cx="128"
          cy="128"
          r="106"
          stroke="#222222"
          strokeWidth="1.2"
          fill="none"
          opacity="0.6"
        />

        {/* Squircle Rim Light */}
        <rect
          x="24"
          y="24"
          width="208"
          height="208"
          rx="46"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          opacity="0.22"
        />
        <rect
          x="26"
          y="26"
          width="204"
          height="204"
          rx="44"
          fill="url(#appIconSquircleBody)"
          stroke="#282828"
          strokeWidth="1.5"
        />
        <rect
          x="28"
          y="28"
          width="200"
          height="200"
          rx="42"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1"
          opacity="0.08"
        />

        {/* Center Monogram (scaled) */}
        <g
          transform="translate(42.5, 42.5) scale(1.336)"
          dangerouslySetInnerHTML={{
            __html: `
              <path d="${LOGO_GEOMETRY.cornerFraming.combinedPath}" stroke="#FFFFFF" stroke-width="${LOGO_GEOMETRY.cornerFraming.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.95" />
              ${getSvgGradients(accentColor, false)}
              ${getMonogramMarkup(accentColor, false)}
            `,
          }}
        />

        {/* Full-width laser beam */}
        <line
          x1="28"
          y1="128"
          x2="228"
          y2="128"
          stroke={accentColor}
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.28"
        />
        <line
          x1="32"
          y1="128"
          x2="224"
          y2="128"
          stroke="url(#appIconHeroLaser)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="128" cy="128" r="30" fill="url(#appIconHeroFlare)" />
        <ellipse cx="128" cy="128" rx="14" ry="3.5" fill="#FFFFFF" opacity="1" />
      </svg>
    );
  }

  let bg = "#0A0A0A";
  let border = "#262626";
  let bracketsColor = "#FFFFFF";

  if (type === "white") {
    bg = "#FFFFFF";
    border = "#E5E5E5";
    bracketsColor = "#0A0A0A";
  } else if (type === "red" || type === "accent") {
    bg = accentColor.startsWith("var") ? accentColor : accentColor;
    border = "#CC0000";
    bracketsColor = "#FFFFFF";
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={role}
      aria-label={ariaLabel || title}
      aria-hidden={isHidden}
      className={cn("shrink-0 select-none", className)}
      {...props}
    >
      {title && <title>{title}</title>}
      <rect
        x="16"
        y="16"
        width="224"
        height="224"
        rx="48"
        fill={bg}
        stroke={border}
        strokeWidth="2"
      />
      <g
        transform="translate(32, 32) scale(1.5)"
        dangerouslySetInnerHTML={{
          __html: `
            <defs>${getSvgGradients(accentColor, isInverse)}</defs>
            <path d="${LOGO_GEOMETRY.cornerFraming.combinedPath}" stroke="${bracketsColor}" stroke-width="${LOGO_GEOMETRY.cornerFraming.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            ${getMonogramMarkup(accentColor, true)}
          `,
        }}
      />
    </svg>
  );
};

AppIcon.displayName = "AppIcon";
