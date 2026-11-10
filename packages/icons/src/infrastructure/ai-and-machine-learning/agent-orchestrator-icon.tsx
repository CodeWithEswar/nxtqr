import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const AgentOrchestratorIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Agent Orchestrator",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#F43F5E" : "#A3A3A3";
  const strokeAccent = isColored ? "#FB7185" : "#E5E5E5";
  const fillCore = isColored ? "#4C0519" : "#141414";
  const fillNode = isColored ? "#881337" : "#262626";
  const accentGlow = isColored ? "#FDA4AF" : "#FFFFFF";

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
      {/* Central Autonomous Planner Core */}
      <circle
        cx="16"
        cy="16"
        r="6.5"
        fill={fillCore}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      {/* Brain / Synapse Spark in Center */}
      <circle cx="16" cy="16" r="2.5" fill={accentGlow} />

      {/* Orbiting Satellite Tool & Memory Nodes */}
      {/* 1. Reasoning Loop Node (Top) */}
      <circle cx="16" cy="4.5" r="3" fill={fillNode} stroke={strokeAccent} strokeWidth="1" />
      <path d="M16 8L16 9.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />

      {/* 2. Tool Invocation Node (Right) */}
      <circle cx="27.5" cy="16" r="3" fill={fillNode} stroke={strokeAccent} strokeWidth="1" />
      <path d="M24 16H22.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />

      {/* 3. Memory Scratchpad Node (Bottom) */}
      <circle cx="16" cy="27.5" r="3" fill={fillNode} stroke={strokeAccent} strokeWidth="1" />
      <path d="M16 24V22.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />

      {/* 4. Human Approval Node (Left) */}
      <circle cx="4.5" cy="16" r="3" fill={fillNode} stroke={strokeAccent} strokeWidth="1" />
      <path d="M8 16H9.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />

      {/* Cyclic ReAct Planning Arrows (Circular Loop) */}
      <path
        d="M20 7.5C24 9.5 26.5 13 26 17"
        stroke={strokeAccent}
        strokeWidth="0.9"
        strokeDasharray="2 1.5"
      />
      <path
        d="M25 21C23 25 19.5 27 15 26.5"
        stroke={strokeAccent}
        strokeWidth="0.9"
        strokeDasharray="2 1.5"
      />
      <path
        d="M12 24.5C8 22.5 5.5 19 6 15"
        stroke={strokeAccent}
        strokeWidth="0.9"
        strokeDasharray="2 1.5"
      />
      <path
        d="M7 11C9 7 12.5 5 17 5.5"
        stroke={strokeAccent}
        strokeWidth="0.9"
        strokeDasharray="2 1.5"
      />
    </svg>
  );
};
