"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Textarea,
} from "@nxtqr/ui";
import { SpinnerIcon } from "@nxtqr/icons";
import { useUpdateProjectMutation } from "../hooks/use-projects";
import type { Project } from "../schemas/project.schema";

export interface EditProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const updateMutation = useUpdateProjectMutation();

  React.useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !name.trim()) return;

    updateMutation.mutate(
      {
        id: project.id,
        updates: {
          name: name.trim(),
          description: description.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-md border border-border-default bg-surface-01 text-foreground shadow-level-2 p-6">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="font-sans text-base font-semibold text-foreground">
            Edit Project Metadata
          </DialogTitle>
          <DialogDescription className="font-sans text-xs text-text-muted">
            Update project name and architecture description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-xs rounded-md border-border-default bg-surface-02 text-foreground"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="text-xs rounded-md border-border-default bg-surface-02 text-foreground resize-none"
            />
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
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
              type="submit"
              size="sm"
              disabled={updateMutation.isPending || !name.trim()}
              className="h-8 px-3 text-xs rounded-md bg-foreground text-background"
            >
              {updateMutation.isPending ? (
                <SpinnerIcon className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

