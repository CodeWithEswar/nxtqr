import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ServiceRegistryIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Service Registry",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBoundary = isColored ? "#C4B5FD" : "#A3A3A3";
  const strokeAccent = isColored ? "#EDE9FE" : "#D4D4D4";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const fillSurface = isColored ? "#581C87" : "#1F1F1F";
  const heartColor = isColored ? "#34D399" : "#E5E5E5";

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={decorative ? "true" : undefined}
      role={decorative ? "presentation" : "img"}
      {...props}
    >
      {!decorative && title && <title>{title}</title>}
      {/* Outer Registry Catalog Box */}
      <rect
        x="3"
        y="4"
        width="26"
        height="24"
        rx="4"
        fill={fillFoundation}
        stroke={strokeBoundary}
        strokeWidth="1.2"
      />

      {/* Directory Index Shelf 1 (Top Service Record) */}
      <rect
        x="6"
        y="7"
        width="20"
        height="5"
        rx="1.5"
        fill={fillSurface}
        stroke={strokeBoundary}
        strokeWidth="1"
      />
      <circle cx="8.5" cy="9.5" r="1.1" fill={heartColor} />
      <line x1="12" y1="9.5" x2="21" y2="9.5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="23.5" cy="9.5" r="0.9" fill={strokeAccent} />

      {/* Directory Index Shelf 2 (Middle Service Record) */}
      <rect
        x="6"
        y="13.5"
        width="20"
        height="5"
        rx="1.5"
        fill={fillSurface}
        stroke={strokeBoundary}
        strokeWidth="1"
      />
      <circle cx="8.5" cy="16" r="1.1" fill={heartColor} />
      <line x1="12" y1="16" x2="19" y2="16" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="23.5" cy="16" r="0.9" fill={strokeAccent} />

      {/* Directory Index Shelf 3 (Bottom Service Record) */}
      <rect
        x="6"
        y="20"
        width="20"
        height="5"
        rx="1.5"
        fill={fillSurface}
        stroke={strokeBoundary}
        strokeWidth="1"
      />
      <circle cx="8.5" cy="22.5" r="1.1" fill={heartColor} />
      <line x1="12" y1="22.5" x2="17" y2="22.5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="23.5" cy="22.5" r="0.9" fill={strokeAccent} />
    </svg>
  );
};

ServiceRegistryIcon.displayName = "ServiceRegistryIcon";

