import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const AuthorizationServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Authorization Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeGreen = isColored ? "#34D399" : "#A3A3A3";
  const fillDeep = isColored ? "#064E3B" : "#262626";
  const fillFoundation = isColored ? "#022C22" : "#141414";
  const strokeAccent = isColored ? "#A7F3D0" : "#E5E5E5";
  const fillShield = isColored ? "#065F46" : "#1F1F1F";

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
      {/* Protected Resource Perimeter Shield */}
      <path
        d="M16 3.5L27 7.5V15.5C27 22.5 22 27 16 29C10 27 5 22.5 5 15.5V7.5L16 3.5Z"
        fill={fillFoundation}
        stroke={strokeGreen}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Internal Evaluation Chamber */}
      <path
        d="M16 6.5L24 9.5V15.5C24 20.8 20.3 24.3 16 26C11.7 24.3 8 20.8 8 15.5V9.5L16 6.5Z"
        fill={fillShield}
        stroke={strokeGreen}
        strokeWidth="1.1"
      />

      {/* RBAC / Access Matrix Decision Lock Gate */}
      <rect
        x="12"
        y="14"
        width="8"
        height="6.5"
        rx="1.2"
        fill={fillDeep}
        stroke={strokeAccent}
        strokeWidth="1.3"
      />
      <path
        d="M13.5 14V11.5C13.5 10.1 14.6 9 16 9C17.4 9 18.5 10.1 18.5 11.5V14"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* Keyhole Decision Indicator */}
      <circle cx="16" cy="16.5" r="0.8" fill={strokeAccent} />
      <line x1="16" y1="17.3" x2="16" y2="18.8" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />

      {/* Policy Allow Status Indicator Arc */}
      <path
        d="M13 22.5L15 24.5L19 20.5"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
