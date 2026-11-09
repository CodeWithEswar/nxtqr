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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@nxtqr/ui";
import { PlusIcon, SpinnerIcon } from "@nxtqr/icons";
import { useCreateProjectMutation } from "../hooks/use-projects";
import {
  VISUALIZER_TYPE_METADATA,
  CreateProjectSchema,
} from "../schemas/project.schema";

export interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [visualizerType, setVisualizerType] = React.useState("system-design");
  const [fieldErrors, setFieldErrors] = React.useState<{ name?: string; description?: string }>({});

  const createMutation = useCreateProjectMutation();

  const resetForm = () => {
    setName("");
    setDescription("");
    setVisualizerType("system-design");
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parseResult = CreateProjectSchema.safeParse({
      name,
      description: description || undefined,
      visualizerType,
    });

    if (!parseResult.success) {
      const errs: { name?: string; description?: string } = {};
      for (const issue of parseResult.error.issues) {
        if (issue.path[0] === "name") errs.name = issue.message;
        if (issue.path[0] === "description") errs.description = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});

    createMutation.mutate(
      {
        name: parseResult.data.name,
        description: parseResult.data.description,
        visualizerType: parseResult.data.visualizerType,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] rounded-md border border-border-default bg-surface-01 text-foreground shadow-level-2 p-6">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="font-sans text-base font-semibold text-foreground">
            Create Engineering Project
          </DialogTitle>
          <DialogDescription className="font-sans text-xs text-text-muted">
            Initialize a new visual diagram or simulation model in your workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Project Name</label>
            <Input
              type="text"
              placeholder="e.g. Distributed Event Broker"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-xs rounded-md border-border-default bg-surface-02 focus:border-border-strong text-foreground"
              autoFocus
            />
            {fieldErrors.name && (
              <p className="text-[11px] text-destructive">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Visualizer Engine</label>
            <Select value={visualizerType} onValueChange={setVisualizerType}>
              <SelectTrigger className="h-9 text-xs rounded-md border-border-default bg-surface-02 text-foreground">
                <SelectValue placeholder="Select Visualizer" />
              </SelectTrigger>
              <SelectContent className="rounded-md border border-border-default bg-surface-02 text-foreground shadow-level-2">
                {Object.entries(VISUALIZER_TYPE_METADATA).map(([key, meta]) => (
                  <SelectItem key={key} value={key} className="text-xs focus:bg-surface-03 focus:text-foreground">
                    <span className="font-medium">{meta.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-text-muted">
              {VISUALIZER_TYPE_METADATA[visualizerType]?.description}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Description <span className="text-text-muted font-normal">(Optional)</span>
            </label>
            <Textarea
              placeholder="Brief architecture summary or functional purpose..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="text-xs rounded-md border-border-default bg-surface-02 focus:border-border-strong text-foreground resize-none"
            />
            {fieldErrors.description && (
              <p className="text-[11px] text-destructive">{fieldErrors.description}</p>
            )}
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 px-3 text-xs rounded-md border-border-default bg-surface-02 hover:bg-surface-03 text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
              className="h-8 px-3 text-xs rounded-md bg-foreground text-background hover:bg-neutral-200 gap-1.5"
            >
              {createMutation.isPending ? (
                <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlusIcon className="h-3.5 w-3.5" />
              )}
              <span>Create Project</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

