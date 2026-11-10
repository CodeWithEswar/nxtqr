import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const SagaOrchestratorIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Saga Orchestrator",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBoundary = isColored ? "#A78BFA" : "#A3A3A3";
  const strokeAccent = isColored ? "#DDD6FE" : "#D4D4D4";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const fillSurface = isColored ? "#4C1D95" : "#1F1F1F";
  const compColor = isColored ? "#F87171" : "#E5E5E5";

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
      {/* Outer Saga State Perimeter */}
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

      {/* Center Orchestrator Coordinator Hub */}
      <circle
        cx="16"
        cy="16"
        r="3.5"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1.4"
      />
      <circle cx="16" cy="16" r="1.2" fill={strokeAccent} />

      {/* Forward Transaction Step 1 (Left Node) */}
      <rect
        x="5.5"
        y="9"
        width="6"
        height="6"
        rx="1.5"
        fill={fillSurface}
        stroke={strokeBoundary}
        strokeWidth="1"
      />
      <path d="M11.5 12H13.5M13.5 12L15 14.5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* Forward Transaction Step 2 (Right Node) */}
      <rect
        x="20.5"
        y="9"
        width="6"
        height="6"
        rx="1.5"
        fill={fillSurface}
        stroke={strokeBoundary}
        strokeWidth="1"
      />
      <path d="M17 14.5L18.5 12M18.5 12H20.5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* Compensating Action Flow (Bottom Return Loop indicating rollback/compensation) */}
      <rect
        x="13"
        y="21"
        width="6"
        height="5.5"
        rx="1.5"
        fill={fillSurface}
        stroke={compColor}
        strokeWidth="1"
      />
      {/* Compensation Flow Arc */}
      <path
        d="M21 16C21 19 19.5 21 17 21"
        stroke={compColor}
        strokeWidth="1.2"
        strokeDasharray="2 1.5"
        strokeLinecap="round"
      />
      <path
        d="M13 21C10.5 21 9 19 9 16"
        stroke={compColor}
        strokeWidth="1.2"
        strokeDasharray="2 1.5"
        strokeLinecap="round"
      />
      {/* Reverse Compensation Arrowhead */}
      <path
        d="M8 17.5L9 15.5L10 17.5"
        stroke={compColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

SagaOrchestratorIcon.displayName = "SagaOrchestratorIcon";

