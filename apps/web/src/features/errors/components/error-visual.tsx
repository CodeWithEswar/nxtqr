"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@nxtqr/utils";

export interface ErrorVisualProps {
  variant?: "not-found" | "error" | "restricted" | "service-unavailable";
  className?: string;
}

export function ErrorVisual({
  variant = "not-found",
  className,
}: ErrorVisualProps) {
  const shouldReduceMotion = useReducedMotion();

  // Pure SVG technical graph diagram
  // Width: 260, Height: 90
  // Node Alpha (x: 40, y: 45) -> Node Beta (x: 220, y: 45)
  // Connection line interrupted in middle
  return (
    <div
      className={cn(
        "relative flex items-center justify-center w-full max-w-[280px] h-24 select-none",
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 260 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        {/* Ambient subtle connection grid/guide */}
        <line
          x1="20"
          y1="45"
          x2="240"
          y2="45"
          stroke="#1A1A1A"
          strokeWidth="1"
          strokeDasharray="2 3"
        />

        {/* Node Alpha (Source Node) */}
        <rect
          x="30"
          y="35"
          width="20"
          height="20"
          rx="4"
          fill="#0D0D0D"
          stroke="#262626"
          strokeWidth="1.5"
        />
        <circle cx="40" cy="45" r="3" fill="#B5B5B5" />

        {/* Node Beta (Target Node) */}
        <rect
          x="210"
          y="35"
          width="20"
          height="20"
          rx="4"
          fill="#080808"
          stroke={variant === "restricted" ? "#333333" : "#202020"}
          strokeWidth="1.5"
        />
        {variant === "restricted" ? (
          // Small keyhole / lock motif
          <circle cx="220" cy="45" r="2.5" fill="#666666" />
        ) : (
          <circle cx="220" cy="45" r="2.5" fill="#404040" />
        )}

        {/* Connected path leading from Node Alpha */}
        <line
          x1="50"
          y1="45"
          x2="115"
          y2="45"
          stroke="#404040"
          strokeWidth="1.5"
        />

        {/* Interrupted / Break gap indicator */}
        <g stroke="#333333" strokeWidth="1.5" strokeLinecap="round">
          <line x1="122" y1="40" x2="118" y2="50" />
          <line x1="130" y1="40" x2="126" y2="50" />
        </g>

        {/* Disconnected path to Node Beta */}
        <line
          x1="135"
          y1="45"
          x2="210"
          y2="45"
          stroke="#202020"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />

        {/* Signal pulse packet animation (stops before gap) */}
        {!shouldReduceMotion && (
          <motion.circle
            r="2.5"
            cy="45"
            fill="#FFFFFF"
            initial={{ cx: 50, opacity: 0 }}
            animate={{
              cx: [50, 115, 115],
              opacity: [0, 0.9, 0],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.7, 1],
            }}
          />
        )}
      </svg>
    </div>
  );
}
