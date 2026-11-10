import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const WhatsappProviderIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "WhatsApp Provider",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#4ADE80" : "#A3A3A3";
  const strokeAccent = isColored ? "#BBF7D0" : "#D4D4D4";
  const fillFoundation = isColored ? "#052E16" : "#141414";
  const fillSurface = isColored ? "#14532D" : "#1F1F1F";

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
      {/* Outer External WhatsApp Partner Boundary */}
      <circle
        cx="16"
        cy="16"
        r="12.5"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeDasharray="2.5 1.5"
      />

      {/* Structured Business Chat Bubble */}
      <path
        d="M8.5 14.5C8.5 10.9 11.6 8 15.5 8C19.4 8 22.5 10.9 22.5 14.5C22.5 18.1 19.4 21 15.5 21C14.3 21 13.1 20.7 12.1 20.1L9 21L9.9 18.2C9 17.1 8.5 15.8 8.5 14.5Z"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Double Read Receipt Checkmarks (Delivery Confirmation) */}
      <path
        d="M12.5 14.5L14 16L17.5 12"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 14.5L17 16L20.5 12"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

WhatsappProviderIcon.displayName = "WhatsappProviderIcon";
