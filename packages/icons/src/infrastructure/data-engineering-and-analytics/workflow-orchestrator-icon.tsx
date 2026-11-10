import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const WorkflowOrchestratorIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Workflow Orchestrator",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#F87171" : "#A3A3A3";
  const strokeAccent = isColored ? "#FCA5A5" : "#E5E5E5";
  const fillFoundation = isColored ? "#450A0A" : "#141414";
  const fillNode = isColored ? "#991B1B" : "#262626";

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
      {/* 1. DAG Task Dependency Edges */}
      {/* Trigger -> Parallel Branch 1 */}
      <path d="M8 16L14 8.5" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />
      {/* Trigger -> Parallel Branch 2 */}
      <path d="M8 16L14 23.5" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />
      {/* Parallel Branch 1 -> Sink */}
      <path d="M18 8.5L24 16" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />
      {/* Parallel Branch 2 -> Sink */}
      <path d="M18 23.5L24 16" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />

      {/* 2. Orchestration Nodes */}
      {/* Root Schedule Trigger Node */}
      <circle cx="6" cy="16" r="3.5" fill={fillFoundation} stroke={strokeColor} strokeWidth="1.3" />
      {/* Mini Clock Hand inside trigger */}
      <path d="M6 14.5V16H7.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Parallel Task 1 (Top) */}
      <rect x="13" y="6" width="6" height="6" rx="1.5" fill={fillNode} stroke={strokeColor} strokeWidth="1.3" />
      <path d="M14.5 9L15.5 10L17.5 8" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />

      {/* Parallel Task 2 (Bottom) */}
      <rect x="13" y="20" width="6" height="6" rx="1.5" fill={fillNode} stroke={strokeColor} strokeWidth="1.3" />
      <path d="M14.5 23L15.5 24L17.5 22" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />

      {/* Final Convergence & Execution Sink Node (Right) */}
      <circle cx="26" cy="16" r="3.5" fill={fillFoundation} stroke={strokeColor} strokeWidth="1.3" />
      <circle cx="26" cy="16" r="1.5" fill={strokeAccent} />

      {/* Workflow Scheduling Pulse Rings (Outer Arc) */}
      <path
        d="M20 3.5C24.5 5 28 9.5 28.5 15"
        stroke={strokeColor}
        strokeWidth="1.1"
        strokeDasharray="2 2"
        strokeLinecap="round"
      />
    </svg>
  );
};
