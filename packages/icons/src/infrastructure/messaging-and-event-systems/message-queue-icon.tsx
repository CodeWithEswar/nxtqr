import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const MessageQueueIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Message Queue",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeOrange = isColored ? "#FB923C" : "#A3A3A3";
  const fillFoundation = isColored ? "#451A03" : "#1A1A1A";
  const strokeAccent = isColored ? "#FED7AA" : "#E5E5E5";
  const fillMessage = isColored ? "#7C2D12" : "#262626";

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
      {/* Outer Queue Enclosure (U-shaped Pipe / Channel) */}
      <path
        d="M5 10h18a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H5"
        stroke={strokeOrange}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Enclosure Backplate */}
      <rect
        x="6"
        y="11.5"
        width="16"
        height="9"
        rx="2"
        fill={fillFoundation}
      />

      {/* Sequential Ordered Messages in FIFO Transit */}
      {/* Message 1 (Head / Ready to Dequeue) */}
      <rect
        x="17"
        y="12.5"
        width="4.5"
        height="7"
        rx="1"
        fill={fillMessage}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />
      {/* Message 2 (Mid Queue) */}
      <rect
        x="11"
        y="12.5"
        width="4.5"
        height="7"
        rx="1"
        fill={fillMessage}
        stroke={strokeOrange}
        strokeWidth="1.2"
      />
      {/* Message 3 (Tail / Just Enqueued) */}
      <rect
        x="5"
        y="12.5"
        width="4.5"
        height="7"
        rx="1"
        fill={fillMessage}
        stroke={strokeOrange}
        strokeWidth="1.2"
      />

      {/* Ingress Enqueue Arrow */}
      <path
        d="M2.5 16h2M3.5 14.5l1.5 1.5-1.5 1.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Egress Dequeue Forward Indicator */}
      <path
        d="M24 16h4.5M26.5 14l2 2-2 2"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* FIFO Indicator Dots */}
      <circle cx="9.5" cy="26" r="1" fill={strokeOrange} />
      <circle cx="14" cy="26" r="1" fill={strokeOrange} />
      <circle cx="18.5" cy="26" r="1" fill={strokeAccent} />
    </svg>
  );
};
