"use client";

import { useEffect } from "react";
import { useShellStore } from "../store/shell-store";

export function useCommandShortcuts() {
  const toggleSidebar = useShellStore((s) => s.toggleSidebar);
  const setCommandPaletteOpen = useShellStore((s) => s.setCommandPaletteOpen);
  const commandPaletteOpen = useShellStore((s) => s.commandPaletteOpen);
  const setMobileNavOpen = useShellStore((s) => s.setMobileNavOpen);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+K or Cmd+K: Open Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
        return;
      }

      // Don't trigger other single-key or standard shortcuts when typing in inputs
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // Ctrl+B or Cmd+B: Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        if (!isInput) {
          e.preventDefault();
          toggleSidebar();
          return;
        }
      }

      // Escape: Dismiss mobile nav or close command palette
      if (e.key === "Escape") {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
        }
        setMobileNavOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar, setCommandPaletteOpen, commandPaletteOpen, setMobileNavOpen]);
}

