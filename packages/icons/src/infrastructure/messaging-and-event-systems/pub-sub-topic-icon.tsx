import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const PubSubTopicIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Pub/Sub Topic",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeCyan = isColored ? "#38BDF8" : "#A3A3A3";
  const fillCore = isColored ? "#0C4A6E" : "#1A1A1A";
  const strokeAccent = isColored ? "#BAE6FD" : "#E5E5E5";
  const fillSub = isColored ? "#0369A1" : "#262626";

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
      {/* Central Logical Topic Core (Concentric Broadcast Hub) */}
      <circle
        cx="10"
        cy="16"
        r="6"
        fill={fillCore}
        stroke={strokeCyan}
        strokeWidth="1.5"
      />
      <circle cx="10" cy="16" r="2.5" fill={strokeAccent} />

      {/* Ingress Publish Arrow (Left to Topic) */}
      <path
        d="M2 16h3M3.5 14.5L5 16l-1.5 1.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Fan-Out Subscription Branch 1 (Top Subscriber) */}
      <path
        d="M15 13.5l7-6.5M21 7h2v2"
        stroke={strokeCyan}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="25.5" cy="6" r="3" fill={fillSub} stroke={strokeAccent} strokeWidth="1.2" />

      {/* Fan-Out Subscription Branch 2 (Mid-Right Subscriber) */}
      <path
        d="M16 16h6M20.5 14.5l1.5 1.5-1.5 1.5"
        stroke={strokeCyan}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="16" r="3" fill={fillSub} stroke={strokeCyan} strokeWidth="1.2" />

      {/* Fan-Out Subscription Branch 3 (Bottom Subscriber) */}
      <path
        d="M15 18.5l7 6.5M21 25h2v-2"
        stroke={strokeCyan}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="25.5" cy="26" r="3" fill={fillSub} stroke={strokeAccent} strokeWidth="1.2" />

      {/* Broadcast Wave Rings */}
      <path
        d="M12 9.5a8 8 0 0 1 0 13"
        stroke={strokeCyan}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
};
