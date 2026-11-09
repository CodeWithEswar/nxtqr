import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const WebhookDispatcherIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Webhook Dispatcher",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeViolet = isColored ? "#A78BFA" : "#A3A3A3";
  const fillSource = isColored ? "#3B0764" : "#1A1A1A";
  const strokeAccent = isColored ? "#E9D5FF" : "#E5E5E5";
  const fillTarget = isColored ? "#581C87" : "#262626";

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
      {/* Webhook Core Dispatch Engine (Left) */}
      <rect
        x="3"
        y="10"
        width="11"
        height="12"
        rx="2.5"
        fill={fillSource}
        stroke={strokeViolet}
        strokeWidth="1.5"
      />
      {/* HTTP Webhook Plug / Hook Motif */}
      <path
        d="M7 16h4M9 13.5l2.5 2.5-2.5 2.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Outbound Dispatch Branch 1 (HTTP Endpoint Top) */}
      <path
        d="M14 13.5l6-6.5h3.5"
        stroke={strokeViolet}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="23.5"
        y="4.5"
        width="6"
        height="5"
        rx="1.5"
        fill={fillTarget}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />

      {/* Outbound Dispatch Branch 2 (HTTP Endpoint Middle) */}
      <path
        d="M14 16h9.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <rect
        x="23.5"
        y="13.5"
        width="6"
        height="5"
        rx="1.5"
        fill={fillTarget}
        stroke={strokeViolet}
        strokeWidth="1.2"
      />

      {/* Outbound Dispatch Branch 3 (HTTP Endpoint Bottom) */}
      <path
        d="M14 18.5l6 6.5h3.5"
        stroke={strokeViolet}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="23.5"
        y="22.5"
        width="6"
        height="5"
        rx="1.5"
        fill={fillTarget}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />

      {/* Webhook Transmission Wave Radio Pulses */}
      <path
        d="M16 11a7 7 0 0 1 0 10"
        stroke={strokeViolet}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
};
