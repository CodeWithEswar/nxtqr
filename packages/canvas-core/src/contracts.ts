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
