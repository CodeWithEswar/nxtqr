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
  const packets =
    currentFrame.travelingPackets && currentFrame.travelingPackets.length > 0
      ? currentFrame.travelingPackets
      : currentFrame.travelingRequest
        ? [currentFrame.travelingRequest]
        : [];

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

      {/* 1b. Fault & Circuit Breaker Indicators on All Impacted Nodes */}
      {currentFrame.runtimeState?.componentHealth &&
        Object.entries(currentFrame.runtimeState.componentHealth).map(([nodeId, health]) => {
          if (health === "healthy") return null;
          const node = getNode(nodeId);
          if (!node) return null;

          const isUnavailable = health === "unavailable";
          const cb = currentFrame.runtimeState?.circuitBreakers?.[nodeId];

          return (
            <div
              key={`fault_node_${nodeId}`}
              style={{
                transform: `translate(${node.position.x}px, ${node.position.y}px)`,
              }}
              className="absolute top-0 left-0 pointer-events-none z-20"
            >
              <div className="absolute -top-3.5 left-2 flex items-center gap-1">
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded font-mono text-[9px] uppercase font-bold tracking-wider shadow-level-2 border",
                    isUnavailable
                      ? "bg-red-950 text-red-300 border-red-800"
                      : "bg-amber-950 text-amber-300 border-amber-800"
                  )}
                >
                  {isUnavailable ? "⚠ OUTAGE" : "⚡ DEGRADED"}
                </span>

                {cb && cb.state !== "closed" && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded font-mono text-[9px] uppercase font-bold shadow-level-2 border",
                      cb.state === "open"
                        ? "bg-surface-04 text-red-400 border-red-800"
                        : "bg-surface-04 text-amber-300 border-amber-800"
                    )}
                  >
                    CB: {cb.state.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          );
        })}

      {/* 1c. Traffic Worker Pool Occupancy & Queue Depth Badges */}
      {currentFrame.runtimeState?.trafficInstances &&
        Object.entries(currentFrame.runtimeState.trafficInstances).map(([nodeId, instances]) => {
          const node = getNode(nodeId);
          if (!node || instances.length === 0) return null;

          const totalWorkers = instances.reduce((sum, i) => sum + i.workerCount, 0);
          const busyWorkers = instances.reduce((sum, i) => sum + i.busyWorkers, 0);
          const q = currentFrame.runtimeState?.trafficQueues?.[nodeId];
          const queueDepth = q ? q.waitingCount : 0;
          const isSaturated = totalWorkers > 0 && busyWorkers >= totalWorkers;

          return (
            <div
              key={`traffic_pool_${nodeId}`}
              style={{
                transform: `translate(${node.position.x}px, ${node.position.y}px)`,
              }}
              className="absolute top-0 left-0 pointer-events-none z-20"
            >
              <div className="absolute -bottom-3 left-2 flex items-center gap-1.5 font-mono text-[9px]">
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded shadow-level-1 border bg-surface-03",
                    isSaturated
                      ? "border-border-strong text-foreground font-semibold"
                      : "border-border-default text-text-secondary"
                  )}
                >
                  W: {busyWorkers}/{totalWorkers}
                  {instances.length > 1 ? ` (${instances.length} inst)` : ""}
                </span>

                {queueDepth > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-surface-04 border border-border-strong text-text-secondary font-semibold shadow-level-1">
                    Q: {queueDepth}
                  </span>
                )}
              </div>
            </div>
          );
        })}

      {/* 2. Traveling Request / Response / Message Packets along Edges */}
      {packets.map((pkt, idx) => (
        <TravelingPacketMarker
          key={pkt.id || `${pkt.edgeId}_${pkt.sourceNodeId}_${pkt.targetNodeId}_${idx}`}
          edgeId={pkt.edgeId}
          sourceNodeId={pkt.sourceNodeId}
          targetNodeId={pkt.targetNodeId}
          direction={pkt.direction || "request"}
          kind={pkt.kind || (pkt.direction as any) || "request"}
          label={pkt.label}
          indexOffset={(idx % 3) * 6}
          prefersReducedMotion={prefersReducedMotion}
        />
      ))}
    </div>
  );
}

interface TravelingPacketMarkerProps {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  direction: "request" | "response" | "message" | "acknowledgment";
  kind?: "request" | "response" | "message" | "acknowledgment";
  label?: string;
  indexOffset?: number;
  prefersReducedMotion: boolean;
}

function TravelingPacketMarker({
  edgeId,
  sourceNodeId,
  targetNodeId,
  direction,
  kind = "request",
  label,
  indexOffset = 0,
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
            // Position along edge path based on direction and motion preference
            let ratio = 0.5;
            if (prefersReducedMotion) {
              ratio = direction === "response" || direction === "acknowledgment" ? 0.15 : 0.85;
            } else {
              ratio = direction === "response" || direction === "acknowledgment" ? 0.45 : 0.55;
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

  const isResponse = kind === "response";
  const isMessage = kind === "message";
  const isAck = kind === "acknowledgment";

  const defaultLabel = isResponse
    ? "RES ◀"
    : isMessage
      ? "MSG ✉"
      : isAck
        ? "ACK ✓"
        : "REQ ▶";

  return (
    <div
      style={{
        transform: `translate(${coords.x - 20 + indexOffset}px, ${coords.y - 10 + indexOffset}px)`,
      }}
      className="absolute top-0 left-0 transition-transform duration-100 ease-linear pointer-events-none z-30"
    >
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold shadow-level-3 border select-none",
          kind === "request" && "bg-foreground text-background border-border-strong",
          isResponse && "bg-surface-04 text-foreground border-border-strong",
          isMessage && "bg-surface-03 text-foreground border-border-default",
          isAck && "bg-surface-02 text-text-secondary border-border-subtle"
        )}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            kind === "request"
              ? "bg-background animate-ping"
              : "bg-foreground animate-pulse"
          )}
        />
        <span>{label || defaultLabel}</span>
      </div>
    </div>
  );
}
