import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ManagedKubernetesIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Managed Kubernetes",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#818CF8" : "#A3A3A3";
  const strokeAccent = isColored ? "#C7D2FE" : "#D4D4D4";
  const fillFoundation = isColored ? "#1E1B4B" : "#141414";
  const fillSurface = isColored ? "#312E81" : "#1F1F1F";

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
      {/* Outer Hexagonal Cluster Ring */}
      <path
        d="M16 4.5L25.5 10V21.5L16 27L6.5 21.5V10L16 4.5Z"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Managed Control Plane Hub (Center Hexagon) */}
      <path
        d="M16 10.5L20.5 13.2V18.8L16 21.5L11.5 18.8V13.2L16 10.5Z"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />

      {/* Control Plane Center Core */}
      <circle cx="16" cy="16" r="2" fill={strokeAccent} />

      {/* Worker Node Pod Spokes */}
      <line x1="16" y1="4.5" x2="16" y2="10.5" stroke={strokeColor} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="25.5" y1="10" x2="20.5" y2="13.2" stroke={strokeColor} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="25.5" y1="21.5" x2="20.5" y2="18.8" stroke={strokeColor} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="16" y1="27" x2="16" y2="21.5" stroke={strokeColor} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="6.5" y1="21.5" x2="11.5" y2="18.8" stroke={strokeColor} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="6.5" y1="10" x2="11.5" y2="13.2" stroke={strokeColor} strokeWidth="1.1" strokeLinecap="round" />

      {/* Managed Pod Vertex Points */}
      <circle cx="16" cy="7.5" r="1" fill={strokeAccent} />
      <circle cx="23" cy="11.6" r="1" fill={strokeAccent} />
      <circle cx="23" cy="20.2" r="1" fill={strokeAccent} />
      <circle cx="16" cy="24.2" r="1" fill={strokeAccent} />
      <circle cx="9" cy="20.2" r="1" fill={strokeAccent} />
      <circle cx="9" cy="11.6" r="1" fill={strokeAccent} />
    </svg>
  );
};

