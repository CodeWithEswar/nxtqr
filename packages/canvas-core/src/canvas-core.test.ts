import { describe, it, expect } from "vitest";
import {
  screenToCanvas,
  canvasToScreen,
  snapToGrid,
  clampZoom,
  calculateBoundingBox,
} from "./contracts";

describe("CanvasCore Math & Viewport Contracts", () => {
  const viewport = { x: 100, y: 50, zoom: 2.0 };

  it("converts screen coordinates to canvas space", () => {
    const canvasPos = screenToCanvas(200, 150, viewport);
    expect(canvasPos.x).toBe(50); // (200 - 100) / 2
    expect(canvasPos.y).toBe(50); // (150 - 50) / 2
  });

  it("converts canvas coordinates to screen space", () => {
    const screenPos = canvasToScreen(50, 50, viewport);
    expect(screenPos.x).toBe(200); // 50 * 2 + 100
    expect(screenPos.y).toBe(150); // 50 * 2 + 50
  });

  it("snaps values to 20px base grid", () => {
    expect(snapToGrid(23)).toBe(20);
    expect(snapToGrid(31)).toBe(40);
    expect(snapToGrid(0)).toBe(0);
  });

  it("clamps zoom within safe bounds [0.1, 3.0]", () => {
    expect(clampZoom(0.05)).toBe(0.1);
    expect(clampZoom(4.5)).toBe(3.0);
    expect(clampZoom(1.5)).toBe(1.5);
  });

  it("calculates multi-node bounding box", () => {
    const bbox = calculateBoundingBox([
      { position: { x: 10, y: 20 }, width: 100, height: 50 },
      { position: { x: 150, y: 200 }, width: 80, height: 40 },
    ]);
    expect(bbox).not.toBeNull();
    expect(bbox?.minX).toBe(10);
    expect(bbox?.minY).toBe(20);
    expect(bbox?.maxX).toBe(230); // 150 + 80
    expect(bbox?.maxY).toBe(240); // 200 + 40
  });
});

