"use client";

import * as React from "react";
import { useGraphEditorStore, type AutosaveStatus } from "../store/graph-editor-store";
import { createBrowserClient } from "@nxtqr/database/client";
import {
  GraphDocumentSchema,
  migrateGraphDocument,
  CURRENT_GRAPH_SCHEMA_VERSION,
  type GraphDocument,
} from "../schemas/graph.schema";

export function useGraphPersistence(projectId?: string | null): {
  autosaveStatus: AutosaveStatus;
  saveNow: () => Promise<void>;
} {
  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);
  const viewport = useGraphEditorStore((s) => s.viewport);
  const title = useGraphEditorStore((s) => s.title);
  const visualizerType = useGraphEditorStore((s) => s.visualizerType);
  const metadata = useGraphEditorStore((s) => s.metadata);
  const autosaveStatus = useGraphEditorStore((s) => s.autosaveStatus);
  const setAutosaveStatus = useGraphEditorStore((s) => s.setAutosaveStatus);
  const loadDocument = useGraphEditorStore((s) => s.loadDocument);

  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = React.useRef(true);
  const supabase = React.useMemo(() => createBrowserClient(), []);

  // 1. Initial Load: If projectId is provided, load from Supabase projects table
  React.useEffect(() => {
    if (!projectId) return;
    const currentProjectId = projectId;

    let isSubscribed = true;

    async function fetchProjectGraph() {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("id, name, visualizer_type, graph_document")
          .eq("id", currentProjectId)
          .maybeSingle();

        if (error || !data || !isSubscribed) return;

        const rawDoc = data.graph_document as Record<string, unknown> | null;
        if (rawDoc && Object.keys(rawDoc).length > 0) {
          const migrated = migrateGraphDocument({
            ...rawDoc,
            id: rawDoc.id || `doc_${currentProjectId.slice(0, 8)}`,
            visualizerType: rawDoc.visualizerType || data.visualizer_type || "generic",
            title: rawDoc.title || data.name || "Project Architecture",
          });
          loadDocument(migrated, currentProjectId);
        }
      } catch (err) {
        console.error("[GraphPersistence] Failed to load graph document:", err);
      } finally {
        isInitialMount.current = false;
      }
    }

    fetchProjectGraph();

    return () => {
      isSubscribed = false;
    };
  }, [projectId, supabase, loadDocument]);

  // 2. Perform Save
  const saveNow = React.useCallback(async () => {
    if (!projectId) {
      setAutosaveStatus("saved");
      return;
    }
    const currentProjectId = projectId;

    try {
      setAutosaveStatus("saving");

      const doc: GraphDocument = {
        id: `doc_${currentProjectId.slice(0, 8)}`,
        schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
        visualizerType: visualizerType || "generic",
        title: title || "Project Architecture",
        nodes,
        edges,
        viewport,
        metadata,
      };

      // Validate schema before persisting
      const validated = GraphDocumentSchema.parse(doc);

      const { error } = await supabase
        .from("projects")
        .update({
          graph_document: validated as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentProjectId);

      if (error) {
        throw error;
      }

      setAutosaveStatus("saved");
    } catch (err) {
      console.error("[GraphPersistence] Autosave failed:", err);
      setAutosaveStatus("error");
    }
  }, [
    projectId,
    nodes,
    edges,
    viewport,
    title,
    visualizerType,
    metadata,
    supabase,
    setAutosaveStatus,
  ]);

  // 3. Debounced Autosave (1000ms delay after graph modifications)
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!projectId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveNow();
    }, 1000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [nodes, edges, viewport, projectId, saveNow]);

  return {
    autosaveStatus,
    saveNow,
  };
}

