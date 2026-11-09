import * as React from "react";
import { useGraphEditorStore } from "../store/graph-editor-store";

export function useGraphShortcuts(): void {
  const undo = useGraphEditorStore((s) => s.undo);
  const redo = useGraphEditorStore((s) => s.redo);
  const deleteSelected = useGraphEditorStore((s) => s.deleteSelected);
  const copySelected = useGraphEditorStore((s) => s.copySelected);
  const pasteClipboard = useGraphEditorStore((s) => s.pasteClipboard);
  const duplicateSelected = useGraphEditorStore((s) => s.duplicateSelected);
  const selectAll = useGraphEditorStore((s) => s.selectAll);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Guard against firing shortcuts when user is focused inside an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const isModifier = e.ctrlKey || e.metaKey;

      // Select All (Ctrl/Cmd + A)
      if (isModifier && e.key.toLowerCase() === "a") {
        e.preventDefault();
        selectAll();
        return;
      }

      // Undo (Ctrl/Cmd + Z without Shift)
      if (isModifier && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }

      // Redo (Ctrl/Cmd + Shift + Z OR Ctrl/Cmd + Y)
      if (
        (isModifier && e.shiftKey && e.key.toLowerCase() === "z") ||
        (isModifier && e.key.toLowerCase() === "y")
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Copy (Ctrl/Cmd + C)
      if (isModifier && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelected();
        return;
      }

      // Paste (Ctrl/Cmd + V)
      if (isModifier && e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteClipboard();
        return;
      }

      // Duplicate (Ctrl/Cmd + D)
      if (isModifier && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      // Delete (Delete or Backspace)
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    undo,
    redo,
    deleteSelected,
    copySelected,
    pasteClipboard,
    duplicateSelected,
    selectAll,
  ]);
}

