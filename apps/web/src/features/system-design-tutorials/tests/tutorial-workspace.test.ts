import { describe, expect, it, vi } from "vitest";
import { getExampleBySlug } from "../lib/examples-registry";
import { getTutorialWorkspaceDocument } from "../lib/tutorial-workspace";

describe("tutorial workspace imports", () => {
  const example = getExampleBySlug("video-streaming")!.graphDocument;

  it("resolves the requested template without reading any previous preview", () => {
    const readPreview = vi.fn(() => JSON.stringify(example));
    const template = getTutorialWorkspaceDocument("url-shortener", example.id, readPreview);
    expect(template).toEqual(getExampleBySlug("url-shortener")!.graphDocument);
    expect(readPreview).not.toHaveBeenCalled();
  });

  it("restores the matching preview with its positions and edges", () => {
    const preview = { ...example, id: "doc_preview_video_connected" };
    const readPreview = () => JSON.stringify(preview);
    expect(getTutorialWorkspaceDocument(null, preview.id, readPreview)).toEqual(preview);
    expect(getTutorialWorkspaceDocument(null, preview.id, readPreview)).toEqual(preview);
    expect(getTutorialWorkspaceDocument(null, "other-preview", readPreview)).toBeUndefined();
  });

  it("rejects missing, invalid, or oversized preview data", () => {
    expect(getTutorialWorkspaceDocument(null, example.id, () => null)).toBeUndefined();
    expect(getTutorialWorkspaceDocument(null, example.id, () => "{")).toBeUndefined();
    expect(
      getTutorialWorkspaceDocument(null, example.id, () => '{"id":"wrong-shape"}'),
    ).toBeUndefined();
    const oversized = JSON.stringify({
      ...example,
      metadata: { data: "x".repeat(5 * 1024 * 1024) },
    });
    expect(getTutorialWorkspaceDocument(null, example.id, () => oversized)).toBeUndefined();
  });
});
