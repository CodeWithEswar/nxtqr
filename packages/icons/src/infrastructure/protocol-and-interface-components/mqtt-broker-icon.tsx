import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const MqttBrokerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  className,
  ...props
}) => {
  const isMono = variant === "monochrome";

  const boundaryFill = isMono ? "#262626" : "#1E1336";
  const boundaryBorder = isMono ? "#525252" : "#7C3AED";
  const primaryPurple = isMono ? "#FFFFFF" : "#A78BFA";
  const secondaryPurple = isMono ? "#A3A3A3" : "#DDD6FE";
  const hubDark = isMono ? "#404040" : "#5B21B6";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MQTT Broker"
      {...props}
    >
      {/* Endpoint Container */}
      <rect
        x="3"
        y="5"
        width="26"
        height="22"
        rx="3"
        fill={boundaryFill}
        stroke={boundaryBorder}
        strokeWidth="1.5"
      />

      {/* Header Bar */}
      <path d="M3 11H29" stroke={boundaryBorder} strokeWidth="1" />
      <rect x="5.5" y="7.5" width="7" height="3" rx="0.5" fill={primaryPurple} />
      <circle cx="16" cy="8.5" r="0.8" fill={secondaryPurple} />
      <circle cx="25" cy="8.5" r="0.8" fill={secondaryPurple} />

      {/* Central Topic Routing Hub */}
      <circle cx="16" cy="18.5" r="3" fill={hubDark} stroke={primaryPurple} strokeWidth="1.2" />
      <circle cx="16" cy="18.5" r="1" fill="#FFFFFF" />

      {/* Publisher Input Line (Left) */}
      <path
        d="M6 18.5H12M12 18.5L10 16.5M12 18.5L10 20.5"
        stroke={primaryPurple}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Subscriber 1 Branch (Top Right: Topic A) */}
      <path
        d="M18.5 16.5L23.5 14M23.5 14L21 13.5M23.5 14L22.5 16.5"
        stroke={secondaryPurple}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="25" cy="13.5" r="1.5" fill={primaryPurple} />

      {/* Subscriber 2 Branch (Bottom Right: Topic B) */}
      <path
        d="M18.5 20.5L23.5 23M23.5 23L22.5 20.5M23.5 23L21 23.5"
        stroke={secondaryPurple}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="25" cy="23.5" r="1.5" fill={primaryPurple} />
    </svg>
  );
};
