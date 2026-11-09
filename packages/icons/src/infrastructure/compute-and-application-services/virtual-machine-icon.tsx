import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const VirtualMachineIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Virtual Machine",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeViolet = isColored ? "#A78BFA" : "#A3A3A3";
  const fillVm = isColored ? "#2E1065" : "#1A1A1A";
  const strokeHost = isColored ? "#818CF8" : "#737373";
  const fillHost = isColored ? "#1E1B4B" : "#262626";
  const strokeHyper = isColored ? "#C4B5FD" : "#525252";
  const fillLed = isColored ? "#DDD6FE" : "#D4D4D4";

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
      {/* Upper Isolated Virtual Compute Instance (Guest OS & Virtual CPU) */}
      <rect
        x="6"
        y="4"
        width="20"
        height="12"
        rx="2.5"
        fill={fillVm}
        stroke={strokeViolet}
        strokeWidth="1.5"
      />
      {/* Virtual Instance Core Lines */}
      <path
        d="M10 8h12M10 11h8"
        stroke={strokeHyper}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="21" cy="11" r="1.2" fill={fillLed} />

      {/* Type-1/Type-2 Hypervisor Virtualization Abstraction Layer */}
      <rect
        x="8"
        y="18"
        width="16"
        height="2.5"
        rx="1"
        fill={fillHost}
        stroke={strokeHyper}
        strokeWidth="1"
      />

      {/* Underlying Bare-Metal Host Hardware Chassis */}
      <rect
        x="4"
        y="22.5"
        width="24"
        height="6.5"
        rx="2"
        fill={fillHost}
        stroke={strokeHost}
        strokeWidth="1.5"
      />
      <circle cx="7.5" cy="25.75" r="1.25" fill={fillLed} />
      <circle cx="11" cy="25.75" r="1.25" fill={strokeHyper} />
      <path d="M16 25.75h9" stroke={strokeHyper} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};

