import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const StaticWebsiteIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Static Website",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeDoc = isColored ? "#60A5FA" : "#D4D4D4";
  const strokeFlap = isColored ? "#93C5FD" : "#A3A3A3";
  const fillFlap = isColored ? "#1D4ED8" : "#262626";
  const strokeCode = isColored ? "#38BDF8" : "#FFFFFF";
  const strokeLines = isColored ? "#CBD5E1" : "#A3A3A3";

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
      {/* Static Document Layout */}
      <path
        d="M7 4h12l6 6v17a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
        fill="#080808"
        stroke={strokeDoc}
        strokeWidth="1.5"
      />
      {/* Folded Top-Right Corner */}
      <path
        d="M19 4v6h6"
        stroke={strokeFlap}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill={fillFlap}
      />
      {/* Static Markup Code Brackets < / > */}
      <path
        d="M11 16l-2.5 2.5L11 21M17 16l2.5 2.5L17 21M15.5 15l-3 6"
        stroke={strokeCode}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Document Content Lines */}
      <line x1="8.5" y1="24.5" x2="19.5" y2="24.5" stroke={strokeLines} strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
};

