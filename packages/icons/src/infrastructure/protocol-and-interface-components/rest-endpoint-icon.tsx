import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const RestEndpointIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  className,
  ...props
}) => {
  const isMono = variant === "monochrome";

  const boundaryFill = isMono ? "#262626" : "#0E2138";
  const boundaryBorder = isMono ? "#525252" : "#3B82F6";
  const primaryBlue = isMono ? "#FFFFFF" : "#60A5FA";
  const secondaryBlue = isMono ? "#A3A3A3" : "#BFDBFE";
  const pillFill = isMono ? "#404040" : "#1D4ED8";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="REST Endpoint"
      {...props}
    >
      {/* Endpoint Container */}
      <rect
        x="3"
        y="5"
        width="26"
        height="22"
        rx="3"
        fill={boundaryFill}
        stroke={boundaryBorder}
        strokeWidth="1.5"
      />

      {/* HTTP Method Badge: "GET/POST" representation */}
      <rect x="5.5" y="7.5" width="8" height="4" rx="1" fill={pillFill} />
      <circle cx="8" cy="9.5" r="0.8" fill="#FFFFFF" />
      <circle cx="11" cy="9.5" r="0.8" fill={secondaryBlue} />

      {/* Resource Path Representation: "/api/resource" */}
      <path
        d="M16 10.5L18 8.5M20 9.5H26"
        stroke={secondaryBlue}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Separator Divider */}
      <path d="M3 13.5H29" stroke={boundaryBorder} strokeWidth="1" />

      {/* CRUD Resource Entity Structure */}
      <rect
        x="6"
        y="16"
        width="11"
        height="8"
        rx="1.5"
        fill={boundaryFill}
        stroke={primaryBlue}
        strokeWidth="1.2"
      />
      <line x1="8.5" y1="18.5" x2="14.5" y2="18.5" stroke={primaryBlue} strokeWidth="1" strokeLinecap="round" />
      <line x1="8.5" y1="21.5" x2="12.5" y2="21.5" stroke={secondaryBlue} strokeWidth="1" strokeLinecap="round" />

      {/* Outbound JSON Representation Array */}
      <path
        d="M20 17H25M20 20H24M20 23H26"
        stroke={secondaryBlue}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Restful Route Link Arrow */}
      <path
        d="M17 19.5H19"
        stroke={primaryBlue}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
};
