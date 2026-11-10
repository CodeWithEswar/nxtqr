import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ConsensusCoordinatorIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Consensus Coordinator",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBoundary = isColored ? "#818CF8" : "#A3A3A3";
  const strokeAccent = isColored ? "#C7D2FE" : "#D4D4D4";
  const fillFoundation = isColored ? "#1E1B4B" : "#141414";
  const fillSurface = isColored ? "#312E81" : "#1F1F1F";
  const quorumColor = isColored ? "#818CF8" : "#E5E5E5";
  const agreeCheck = isColored ? "#34D399" : "#FFFFFF";

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
      {/* Outer Quorum Domain Frame */}
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

      {/* Quorum Voting Network Ring */}
      <circle
        cx="16"
        cy="16"
        r="8.5"
        stroke={strokeBoundary}
        strokeWidth="1"
        strokeDasharray="2 1.5"
      />

      {/* Node 1 (Top Replica) */}
      <circle
        cx="16"
        cy="7.5"
        r="3"
        fill={fillSurface}
        stroke={quorumColor}
        strokeWidth="1.2"
      />
      <circle cx="16" cy="7.5" r="1.1" fill={agreeCheck} />

      {/* Node 2 (Bottom Left Replica) */}
      <circle
        cx="8.5"
        cy="20.5"
        r="3"
        fill={fillSurface}
        stroke={quorumColor}
        strokeWidth="1.2"
      />
      <circle cx="8.5" cy="20.5" r="1.1" fill={agreeCheck} />

      {/* Node 3 (Bottom Right Replica) */}
      <circle
        cx="23.5"
        cy="20.5"
        r="3"
        fill={fillSurface}
        stroke={quorumColor}
        strokeWidth="1.2"
      />
      <circle cx="23.5" cy="20.5" r="1.1" fill={agreeCheck} />

      {/* Center Agreed State Decision Hub (Quorum consensus confirmed) */}
      <circle
        cx="16"
        cy="16"
        r="3.5"
        fill={fillSurface}
        stroke={agreeCheck}
        strokeWidth="1.3"
      />
      {/* Checkmark in center hub */}
      <path
        d="M14.5 16L15.5 17.2L17.5 15"
        stroke={agreeCheck}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Replicated Log Commit Arrows */}
      <path
        d="M16 11V12.5M10.5 19L12.5 18M21.5 19L19.5 18"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
};

ConsensusCoordinatorIcon.displayName = "ConsensusCoordinatorIcon";

