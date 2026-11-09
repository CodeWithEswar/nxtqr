import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const MessageBrokerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Message Broker",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeAmber = isColored ? "#FBBF24" : "#A3A3A3";
  const fillCore = isColored ? "#451A03" : "#1A1A1A";
  const strokeAccent = isColored ? "#FEF08A" : "#E5E5E5";
  const fillNode = isColored ? "#78350F" : "#262626";

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
      {/* Central Broker Hub / Core Router */}
      <rect
        x="10.5"
        y="10.5"
        width="11"
        height="11"
        rx="2.5"
        fill={fillCore}
        stroke={strokeAmber}
        strokeWidth="1.5"
      />

      {/* Internal Routing Matrix / Switch Cross */}
      <path
        d="M16 12v8M12 16h8"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="1.5" fill={strokeAmber} />

      {/* Producer Inbound Channel (Left) */}
      <rect
        x="2.5"
        y="13"
        width="5"
        height="6"
        rx="1.5"
        fill={fillNode}
        stroke={strokeAmber}
        strokeWidth="1.2"
      />
      <path
        d="M7.5 16h3M9 14.5l1.5 1.5-1.5 1.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top Consumer Egress Channel */}
      <path
        d="M16 10.5V6M21.5 6h-5M20 4.5l1.5 1.5-1.5 1.5"
        stroke={strokeAmber}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="22.5"
        y="3.5"
        width="6"
        height="5"
        rx="1.5"
        fill={fillNode}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />

      {/* Right Direct Consumer Egress Channel */}
      <path
        d="M21.5 16h4M24 14.5l1.5 1.5-1.5 1.5"
        stroke={strokeAmber}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="25.5"
        y="13.5"
        width="5"
        height="5"
        rx="1.5"
        fill={fillNode}
        stroke={strokeAmber}
        strokeWidth="1.2"
      />

      {/* Bottom Consumer Egress Channel */}
      <path
        d="M16 21.5V26M21.5 26h-5M20 24.5l1.5 1.5-1.5 1.5"
        stroke={strokeAmber}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="22.5"
        y="23.5"
        width="6"
        height="5"
        rx="1.5"
        fill={fillNode}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />
    </svg>
  );
};
