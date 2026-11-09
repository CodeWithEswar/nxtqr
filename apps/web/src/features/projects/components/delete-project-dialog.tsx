"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  Button,
} from "@nxtqr/ui";
import { SpinnerIcon, TrashIcon } from "@nxtqr/icons";
import { useDeleteProjectMutation } from "../hooks/use-projects";
import type { Project } from "../schemas/project.schema";

export interface DeleteProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProjectDialog({ project, open, onOpenChange }: DeleteProjectDialogProps) {
  const deleteMutation = useDeleteProjectMutation();

  const handleDelete = () => {
    if (!project) return;
    deleteMutation.mutate(project.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[400px] rounded-md border border-border-default bg-surface-01 text-foreground shadow-level-2 p-6">
        <AlertDialogHeader className="space-y-1 text-left">
          <AlertDialogTitle className="font-sans text-base font-semibold text-foreground">
            Delete Project
          </AlertDialogTitle>
          <AlertDialogDescription className="font-sans text-xs text-text-muted">
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold text-foreground">"{project?.name}"</span>? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="pt-3 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 px-3 text-xs rounded-md border-border-default bg-surface-02 text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
            className="h-8 px-3 text-xs rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
          >
            {deleteMutation.isPending ? (
              <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <TrashIcon className="h-3.5 w-3.5" />
            )}
            <span>Delete Project</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

