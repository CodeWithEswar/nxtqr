import { migrateGraphDocument, type GraphDocument } from "@nxtqr/graph-schema";
import { assertPayloadSize } from "@nxtqr/security";
import { getExampleBySlug } from "./examples-registry";

export const TUTORIAL_PREVIEW_STORAGE_KEY = "nxtqr_import_document";
const MAX_TUTORIAL_PREVIEW_BYTES = 5 * 1024 * 1024;

export function getTutorialWorkspaceDocument(
  templateSlug: string | null,
  previewId: string | null,
  readPreview = () => window.sessionStorage.getItem(TUTORIAL_PREVIEW_STORAGE_KEY),
): GraphDocument | undefined {
  if (templateSlug) return getExampleBySlug(templateSlug)?.graphDocument;
  if (!previewId) return;

  try {
    const stored = readPreview();
    if (!stored) return;
    assertPayloadSize(stored, MAX_TUTORIAL_PREVIEW_BYTES, "Tutorial graph");
    const document = migrateGraphDocument(JSON.parse(stored));
    if (document.id === previewId) return document;
  } catch {
    // The preview may be unavailable outside its original tab or after storage is cleared.
  }
}
