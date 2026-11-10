import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ChatServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Chat Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#34D399" : "#A3A3A3";
  const strokeAccent = isColored ? "#6EE7B7" : "#D4D4D4";
  const fillFoundation = isColored ? "#064E3B" : "#141414";
  const fillSurface = isColored ? "#065F46" : "#1F1F1F";

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
      {/* Background / Inbound Conversation Bubble (Top-Right) */}
      <path
        d="M14 6H25C26.6569 6 28 7.34315 28 9V17C28 18.6569 26.6569 20 25 20H24V23L20 20H14C12.3431 20 11 18.6569 11 17V9C11 7.34315 12.3431 6 14 6Z"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Received Message Text Lines */}
      <line x1="15" y1="10" x2="23" y2="10" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <line x1="15" y1="13" x2="20" y2="13" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Foreground / Outbound Real-Time Message Bubble (Bottom-Left) */}
      <path
        d="M7 13H18C19.6569 13 21 14.3431 21 16V23C21 24.6569 19.6569 26 18 26H12L8 29V26H7C5.34315 26 4 24.6569 4 23V16C4 14.3431 5.34315 13 7 13Z"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      {/* Real-Time Message Typing / Dispatch Dots */}
      <circle cx="9" cy="19.5" r="1.3" fill={strokeAccent} />
      <circle cx="12.5" cy="19.5" r="1.3" fill={strokeAccent} />
      <circle cx="16" cy="19.5" r="1.3" fill={strokeAccent} />
    </svg>
  );
};

