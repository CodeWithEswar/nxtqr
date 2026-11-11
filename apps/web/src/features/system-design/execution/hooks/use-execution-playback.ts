import * as React from "react";
import { useExecutionStore } from "../store/execution-store";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";

export function useExecutionPlayback() {
  const isExecutionModeActive = useExecutionStore((s) => s.isExecutionModeActive);
  const isConfigDialogOpen = useExecutionStore((s) => s.isConfigDialogOpen);
  const playbackState = useExecutionStore((s) => s.playbackState);
  const play = useExecutionStore((s) => s.play);
  const pause = useExecutionStore((s) => s.pause);
  const resume = useExecutionStore((s) => s.resume);
  const stop = useExecutionStore((s) => s.stop);
  const nextStep = useExecutionStore((s) => s.nextStep);
  const previousStep = useExecutionStore((s) => s.previousStep);
  const runExecution = useExecutionStore((s) => s.runExecution);
  const toggleConfigDialog = useExecutionStore((s) => s.toggleConfigDialog);

  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in form controls
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.getAttribute("contenteditable") === "true";

      if (isInput) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (!isExecutionModeActive || playbackState.status === "idle" || playbackState.status === "stopped") {
          runExecution(nodes, edges);
        } else if (playbackState.status === "playing") {
          pause();
        } else {
          resume();
        }
        return;
      }

      if (!isExecutionModeActive) return;

      if (e.code === "ArrowRight") {
        e.preventDefault();
        nextStep();
        return;
      }

      if (e.code === "ArrowLeft") {
        e.preventDefault();
        previousStep();
        return;
      }

      if (e.code === "Escape") {
        e.preventDefault();
        if (isConfigDialogOpen) {
          toggleConfigDialog(false);
        } else {
          stop();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isExecutionModeActive,
    isConfigDialogOpen,
    playbackState.status,
    nodes,
    edges,
    runExecution,
    play,
    pause,
    resume,
    stop,
    nextStep,
    previousStep,
    toggleConfigDialog,
  ]);
}
