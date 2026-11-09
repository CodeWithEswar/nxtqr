import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const RabbitmqBrokerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "RabbitMQ Broker",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeOrange = isColored ? "#FB923C" : "#A3A3A3";
  const fillExchange = isColored ? "#431407" : "#1A1A1A";
  const strokeAccent = isColored ? "#FDBA74" : "#E5E5E5";
  const fillQueue = isColored ? "#7C2D12" : "#262626";

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
      {/* Central Exchange (Diamond Router) */}
      <path
        d="M9 16L3 20.5V11.5L9 16z"
        fill={fillExchange}
        stroke={strokeOrange}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="5.5" cy="16" r="1.2" fill={strokeAccent} />

      {/* Direct Binding Link 1 (To Queue 1 Top) */}
      <path
        d="M9 14.5l5-6.5h3"
        stroke={strokeOrange}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Queue 1 (Top Bound Queue) */}
      <rect
        x="17"
        y="5"
        width="12"
        height="6.5"
        rx="1.5"
        fill={fillQueue}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />
      {/* Queue 1 Message Slots */}
      <path d="M21 5v6.5M25 5v6.5" stroke={strokeOrange} strokeWidth="1" />

      {/* Fanout Binding Link 2 (To Queue 2 Middle) */}
      <path
        d="M9 16h8"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Queue 2 (Middle Bound Queue) */}
      <rect
        x="17"
        y="12.75"
        width="12"
        height="6.5"
        rx="1.5"
        fill={fillQueue}
        stroke={strokeOrange}
        strokeWidth="1.2"
      />
      {/* Queue 2 Message Slots */}
      <path d="M21 12.75v6.5M25 12.75v6.5" stroke={strokeAccent} strokeWidth="1" />

      {/* Topic/Headers Binding Link 3 (To Queue 3 Bottom) */}
      <path
        d="M9 17.5l5 6.5h3"
        stroke={strokeOrange}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Queue 3 (Bottom Bound Queue) */}
      <rect
        x="17"
        y="20.5"
        width="12"
        height="6.5"
        rx="1.5"
        fill={fillQueue}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />
      {/* Queue 3 Message Slots */}
      <path d="M21 20.5v6.5M25 20.5v6.5" stroke={strokeOrange} strokeWidth="1" />
    </svg>
  );
};

