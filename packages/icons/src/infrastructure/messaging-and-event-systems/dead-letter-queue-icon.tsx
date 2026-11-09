import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DeadLetterQueueIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Dead-Letter Queue",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeRed = isColored ? "#F87171" : "#A3A3A3";
  const fillQuarantine = isColored ? "#450A0A" : "#1A1A1A";
  const strokeAccent = isColored ? "#FECACA" : "#E5E5E5";
  const fillMessage = isColored ? "#7F1D1D" : "#262626";

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
      {/* Isolated Quarantine Queue Enclosure */}
      <rect
        x="4"
        y="8"
        width="24"
        height="18"
        rx="3"
        fill={fillQuarantine}
        stroke={strokeRed}
        strokeWidth="1.5"
      />

      {/* Safety Quarantine Hazard Hatching / Warning Stripe Header */}
      <path
        d="M4 13h24"
        stroke={strokeRed}
        strokeWidth="1.2"
      />
      <path
        d="M8 8.5l3 4.5M14 8.5l3 4.5M20 8.5l3 4.5"
        stroke={strokeRed}
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Quarantined Failed Message Envelope 1 */}
      <rect
        x="7"
        y="15.5"
        width="7.5"
        height="7.5"
        rx="1.5"
        fill={fillMessage}
        stroke={strokeRed}
        strokeWidth="1.1"
      />
      {/* Poison / Exception Glyphs on Message 1 */}
      <path
        d="M9.25 17.75l3 3M12.25 17.75l-3 3"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Quarantined Failed Message Envelope 2 */}
      <rect
        x="17.5"
        y="15.5"
        width="7.5"
        height="7.5"
        rx="1.5"
        fill={fillMessage}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />
      {/* Alert Warning Sign on Message 2 */}
      <path
        d="M21.25 17.25v2.2M21.25 21v.5"
        stroke={strokeRed}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Rejection Inbound Arc from Top */}
      <path
        d="M16 2.5v3.5M14.5 4.5L16 6l1.5-1.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
