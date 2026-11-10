import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const GraphqlEndpointIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  className,
  ...props
}) => {
  const isMono = variant === "monochrome";

  const boundaryFill = isMono ? "#262626" : "#210F36";
  const boundaryBorder = isMono ? "#525252" : "#9333EA";
  const primaryViolet = isMono ? "#FFFFFF" : "#C084FC";
  const secondaryViolet = isMono ? "#A3A3A3" : "#E9D5FF";
  const nodeDark = isMono ? "#404040" : "#7E22CE";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GraphQL Endpoint"
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

      {/* Header Bar */}
      <path d="M3 10.5H29" stroke={boundaryBorder} strokeWidth="1" />
      <circle cx="6.5" cy="8" r="1" fill={primaryViolet} />
      <path d="M9.5 8H16" stroke={secondaryViolet} strokeWidth="1" strokeLinecap="round" />

      {/* Interconnected GraphQL Graph Schema Nodes */}
      {/* Root Query Node */}
      <circle cx="9" cy="18" r="2.5" fill={nodeDark} stroke={primaryViolet} strokeWidth="1.2" />

      {/* Field Selection Nodes */}
      <circle cx="18" cy="14" r="2" fill={boundaryFill} stroke={secondaryViolet} strokeWidth="1.2" />
      <circle cx="18" cy="22" r="2" fill={boundaryFill} stroke={secondaryViolet} strokeWidth="1.2" />
      <circle cx="25" cy="18" r="2" fill={boundaryFill} stroke={primaryViolet} strokeWidth="1.2" />

      {/* Graph Schema Edges */}
      <line x1="11.2" y1="16.8" x2="16.2" y2="14.8" stroke={primaryViolet} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11.2" y1="19.2" x2="16.2" y2="21.2" stroke={primaryViolet} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="19.8" y1="14.8" x2="23.2" y2="16.8" stroke={secondaryViolet} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="19.8" y1="21.2" x2="23.2" y2="19.2" stroke={secondaryViolet} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="18" y1="16" x2="18" y2="20" stroke={secondaryViolet} strokeWidth="1" strokeDasharray="1.5 1.5" />
    </svg>
  );
};
