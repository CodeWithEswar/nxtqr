import { GraphDocumentSchema, type GraphDocument, CURRENT_GRAPH_SCHEMA_VERSION } from "./schema";

export type MigrationFunction = (rawDoc: Record<string, unknown>) => Record<string, unknown>;

export const schemaMigrations: Record<number, MigrationFunction> = {
  // Version 1 is current baseline
};

export function migrateGraphDocument(rawDoc: unknown): GraphDocument {
  if (!rawDoc || typeof rawDoc !== "object") {
    throw new Error("[NXTQR Graph Schema] Invalid document: document must be an object");
  }

  const doc = { ...(rawDoc as Record<string, unknown>) };
  let version = typeof doc.schemaVersion === "number" ? doc.schemaVersion : 1;

  while (version < CURRENT_GRAPH_SCHEMA_VERSION) {
    const migrator = schemaMigrations[version];
    if (!migrator) {
      throw new Error(
        `[NXTQR Graph Schema] Missing migration function from schema version ${version}`,
      );
    }
    const updated = migrator(doc);
    version += 1;
    doc.schemaVersion = version;
    Object.assign(doc, updated);
  }

  return GraphDocumentSchema.parse(doc);
}
