import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ArchiveStorageIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Archive Storage",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeOrange = isColored ? "#FB923C" : "#A3A3A3";
  const fillDeep = isColored ? "#C2410C" : "#262626";
  const fillFoundation = isColored ? "#431407" : "#141414";
  const strokeAccent = isColored ? "#FED7AA" : "#E5E5E5";
  const fillArchive = isColored ? "#9A3412" : "#1F1F1F";

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
      {/* Heavy Steel Archive Safe / Cold-Vault Chassis */}
      <rect
        x="4"
        y="5"
        width="24"
        height="22"
        rx="2"
        fill={fillFoundation}
        stroke={strokeOrange}
        strokeWidth="1.5"
      />

      {/* Archive Enclosure Lid / Retention Top Seal */}
      <path
        d="M2.5 5C2.5 4.2 3.2 3.5 4 3.5H28C28.8 3.5 29.5 4.2 29.5 5V9.5H2.5V5Z"
        fill={fillDeep}
        stroke={strokeOrange}
        strokeWidth="1.5"
      />

      {/* Layered Archived Records (Index Drawers / Retained Ledger Shelves) */}
      {/* Shelf 1 */}
      <rect
        x="6.5"
        y="12"
        width="19"
        height="5.5"
        rx="1"
        fill={fillArchive}
        stroke={strokeOrange}
        strokeWidth="1.1"
      />
      {/* Shelf 1 Label Slot & Handle */}
      <line x1="13.5" y1="14.75" x2="18.5" y2="14.75" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="9.5" cy="14.75" r="0.75" fill={strokeAccent} />

      {/* Shelf 2 (Cold Tier Bottom Ledger) */}
      <rect
        x="6.5"
        y="19"
        width="19"
        height="5.5"
        rx="1"
        fill={fillArchive}
        stroke={strokeOrange}
        strokeWidth="1.1"
      />
      {/* Shelf 2 Label Slot & Handle */}
      <line x1="13.5" y1="21.75" x2="18.5" y2="21.75" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="9.5" cy="21.75" r="0.75" fill={strokeAccent} />

      {/* Immutability / Compliance Legal-Hold Seal Padlock Motif */}
      <g transform="translate(22, 6.5)">
        <rect
          x="-2.5"
          y="0"
          width="5"
          height="4.5"
          rx="1"
          fill={fillFoundation}
          stroke={strokeAccent}
          strokeWidth="1"
        />
        <path
          d="M-1.5 0V-1.5C-1.5 -2.3 -0.8 -3 0 -3C0.8 -3 1.5 -2.3 1.5 -1.5V0"
          stroke={strokeAccent}
          strokeWidth="1"
        />
      </g>
    </svg>
  );
};

