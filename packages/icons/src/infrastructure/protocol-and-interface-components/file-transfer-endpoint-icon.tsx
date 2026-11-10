import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const FileTransferEndpointIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  className,
  ...props
}) => {
  const isMono = variant === "monochrome";

  const boundaryFill = isMono ? "#262626" : "#0A2433";
  const boundaryBorder = isMono ? "#525252" : "#0284C7";
  const primaryCyan = isMono ? "#FFFFFF" : "#38BDF8";
  const secondaryCyan = isMono ? "#A3A3A3" : "#BAE6FD";
  const fileDark = isMono ? "#404040" : "#0369A1";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="File Transfer Endpoint"
      {...props}
    >
      {/* Endpoint Boundary Box */}
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

      {/* Protocol Header Bar */}
      <path d="M3 11H29" stroke={boundaryBorder} strokeWidth="1" />
      <rect x="5.5" y="7.5" width="8" height="3" rx="0.5" fill={primaryCyan} />
      <circle cx="17" cy="8.5" r="0.8" fill={secondaryCyan} />
      <circle cx="20" cy="8.5" r="0.8" fill={secondaryCyan} />

      {/* File Document Silhouette (Folded Corner) */}
      <path
        d="M6.5 14H12L14.5 16.5V23.5H6.5V14Z"
        fill={fileDark}
        stroke={primaryCyan}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M12 14V16.5H14.5" stroke={primaryCyan} strokeWidth="1" strokeLinejoin="round" />
      <line x1="8.5" y1="18.5" x2="11.5" y2="18.5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
      <line x1="8.5" y1="21" x2="12.5" y2="21" stroke={secondaryCyan} strokeWidth="1" strokeLinecap="round" />

      {/* High-Speed Transfer Channel / Pipe Arrow */}
      <path
        d="M17 19H25M25 19L22 16.5M25 19L22 21.5"
        stroke={primaryCyan}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Transfer Progress / Chunk Blocks */}
      <rect x="17.5" y="14" width="2" height="2" rx="0.4" fill={secondaryCyan} />
      <rect x="21" y="14" width="2" height="2" rx="0.4" fill={secondaryCyan} />
      <rect x="17.5" y="22" width="2" height="2" rx="0.4" fill={secondaryCyan} />
      <rect x="21" y="22" width="2" height="2" rx="0.4" fill={secondaryCyan} />
    </svg>
  );
};
