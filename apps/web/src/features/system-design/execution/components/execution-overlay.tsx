"use client";

import * as React from "react";
import { useReactFlow } from "@xyflow/react";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";

const EMPTY_STRING_ARRAY: string[] = [];

export function ExecutionOverlay() {
  const isExecutionModeActive = useExecutionStore((s) => s.isExecutionModeActive);
  const currentFrame = useExecutionStore((s) => s.playbackState.currentFrame);
  const { getNode } = useReactFlow();

  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!isExecutionModeActive || !currentFrame) {
    return null;
  }

  const activeNodeIds = currentFrame.activeNodeIds ?? EMPTY_STRING_ARRAY;
  const traveling = currentFrame.travelingRequest;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-visible"
    >
      {/* 1. Active Node Visual Overlays */}
      {activeNodeIds.map((nodeId) => {
        const node = getNode(nodeId);
        if (!node) return null;

        const width = node.measured?.width || (node as any).dimensions?.width || 220;
        const height = node.measured?.height || (node as any).dimensions?.height || 90;

        return (
          <div
            key={`overlay_node_${nodeId}`}
            style={{
              transform: `translate(${node.position.x}px, ${node.position.y}px)`,
              width: `${width}px`,
              height: `${height}px`,
            }}
            className="absolute top-0 left-0 transition-transform duration-100 ease-out"
          >
            {/* Restrained dark-neutral active halo - ZERO white borders */}
            <div
              className={cn(
                "absolute -inset-1 rounded-md border-2 border-border-strong bg-surface-04/20 pointer-events-none",
                !prefersReducedMotion && "animate-pulse"
              )}
            />

            {/* Active Component Floating Status Pill */}
            <div className="absolute -top-3.5 right-2 px-1.5 py-0.2 rounded bg-surface-04 border border-border-strong font-mono text-[9px] uppercase tracking-wider text-foreground font-semibold shadow-level-2">
              ● Active
            </div>
          </div>
        );
      })}

      {/* 2. Traveling Request / Response Packet along Edge */}
      {traveling && (
        <TravelingPacketMarker
          edgeId={traveling.edgeId}
          sourceNodeId={traveling.sourceNodeId}
          targetNodeId={traveling.targetNodeId}
          direction={traveling.direction || "request"}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </div>
  );
}

interface TravelingPacketMarkerProps {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  direction: "request" | "response";
  prefersReducedMotion: boolean;
}

function TravelingPacketMarker({
  edgeId,
  sourceNodeId,
  targetNodeId,
  direction,
  prefersReducedMotion,
}: TravelingPacketMarkerProps) {
  const { getNode } = useReactFlow();
  const [coords, setCoords] = React.useState<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    let animId: number;

    const updateMarker = () => {
      // Find the SVG path element rendered by React Flow for this edge
      const edgeEl =
        document.querySelector<SVGPathElement>(`[data-testid="rf__edge-${edgeId}"] path.react-flow__edge-path`) ||
        document.querySelector<SVGPathElement>(`.react-flow__edge[data-id="${edgeId}"] path.react-flow__edge-path`) ||
        document.querySelector<SVGPathElement>(`path[d*="${edgeId}"]`);

      if (edgeEl) {
        try {
          const totalLength = edgeEl.getTotalLength();
          if (totalLength > 0) {
            // If direction is response, reverse percentage position along path
            let ratio = 0.5;
            if (prefersReducedMotion) {
              ratio = direction === "response" ? 0.1 : 0.9;
            } else {
              ratio = direction === "response" ? 0.45 : 0.55;
            }
            const pos = totalLength * ratio;
            const pt = edgeEl.getPointAtLength(pos);
            setCoords({ x: pt.x, y: pt.y });
            return;
          }
        } catch {
          // Fallback to geometric midpoint between source and target nodes
        }
      }

      // Fallback: Geometric midpoint
      const src = getNode(sourceNodeId);
      const tgt = getNode(targetNodeId);
      if (src && tgt) {
        setCoords({
          x: (src.position.x + tgt.position.x) / 2 + 100,
          y: (src.position.y + tgt.position.y) / 2 + 40,
        });
      }
    };

    updateMarker();
    animId = requestAnimationFrame(updateMarker);
    return () => cancelAnimationFrame(animId);
  }, [edgeId, sourceNodeId, targetNodeId, direction, getNode, prefersReducedMotion]);

  if (!coords) return null;

  const isResponse = direction === "response";

  return (
    <div
      style={{
        transform: `translate(${coords.x - 18}px, ${coords.y - 10}px)`,
      }}
      className="absolute top-0 left-0 transition-transform duration-100 ease-linear pointer-events-none z-30"
    >
      <div
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded-full font-mono text-[9px] font-bold shadow-level-3 border",
          isResponse
            ? "bg-surface-04 border-border-strong text-emerald-400"
            : "bg-foreground text-background border-border-strong"
        )}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isResponse ? "bg-emerald-400 animate-ping" : "bg-background animate-ping"
          )}
        />
        <span>{isResponse ? "RES ◀" : "REQ ▶"}</span>
      </div>
    </div>
  );
}
