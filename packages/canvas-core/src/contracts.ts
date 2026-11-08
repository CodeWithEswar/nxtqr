import type { CanvasViewport, NodePosition } from "@nxtqr/graph-schema";

export const CANVAS_CONSTANTS = {
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 3.0,
  DEFAULT_ZOOM: 1.0,
  GRID_SIZE: 20,
  SNAP_DISTANCE: 10,
} as const;

export function screenToCanvas(
  screenX: number,
  screenY: number,
  viewport: CanvasViewport,
): NodePosition {
  return {
    x: (screenX - viewport.x) / viewport.zoom,
    y: (screenY - viewport.y) / viewport.zoom,
  };
}

export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  viewport: CanvasViewport,
): NodePosition {
  return {
    x: canvasX * viewport.zoom + viewport.x,
    y: canvasY * viewport.zoom + viewport.y,
  };
}

export function snapToGrid(val: number, gridSize = CANVAS_CONSTANTS.GRID_SIZE): number {
  return Math.round(val / gridSize) * gridSize;
}

export function clampZoom(zoom: number): number {
  return Math.max(CANVAS_CONSTANTS.MIN_ZOOM, Math.min(CANVAS_CONSTANTS.MAX_ZOOM, zoom));
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function calculateBoundingBox(
  nodes: { position: NodePosition; width?: number; height?: number }[]
): BoundingBox | null {
  if (nodes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const w = node.width ?? 180;
    const h = node.height ?? 80;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
