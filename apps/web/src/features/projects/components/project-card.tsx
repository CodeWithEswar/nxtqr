"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Button,
} from "@nxtqr/ui";
import {
  FolderIcon,
  MoreHorizontalIcon,
  EditIcon,
  CopyIcon,
  ArchiveIcon,
  TrashIcon,
} from "@nxtqr/icons";
import type { Project } from "../schemas/project.schema";
import { VISUALIZER_TYPE_METADATA } from "../schemas/project.schema";
import {
  useArchiveProjectMutation,
  useRestoreProjectMutation,
  useDuplicateProjectMutation,
} from "../hooks/use-projects";

export interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const archiveMutation = useArchiveProjectMutation();
  const restoreMutation = useRestoreProjectMutation();
  const duplicateMutation = useDuplicateProjectMutation();

  const isArchived = project.status === "archived";
  const visualizerMeta = VISUALIZER_TYPE_METADATA[project.visualizerType] || {
    label: project.visualizerType,
  };

  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(project.updatedAt);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "Recent";
    }
  }, [project.updatedAt]);

  const handleToggleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isArchived) {
      restoreMutation.mutate(project.id);
    } else {
      archiveMutation.mutate(project.id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateMutation.mutate(project.id);
  };

  return (
    <Card className="group relative rounded-md border border-border-default bg-surface-01 hover:bg-surface-02 transition-colors shadow-level-1 overflow-hidden">
      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/workspace?project=${project.id}`}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer focus-visible:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-02 border border-border-default group-hover:border-border-strong text-foreground transition-colors shrink-0">
              <FolderIcon className="h-4 w-4 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-semibold text-foreground truncate group-hover:text-neutral-100 transition-colors">
                {project.name}
              </CardTitle>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            {isArchived && (
              <Badge
                variant="outline"
                className="font-mono text-[9px] px-1.5 py-0.5 rounded-md border-border-default bg-surface-03 text-text-muted"
              >
                Archived
              </Badge>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md text-text-muted hover:text-foreground hover:bg-surface-03"
                  aria-label="Project actions"
                >
                  <MoreHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 rounded-md border border-border-default bg-surface-02 text-foreground shadow-level-2"
              >
                <DropdownMenuItem
                  onClick={() => onEdit(project)}
                  className="text-xs gap-2 cursor-pointer focus:bg-surface-03 focus:text-foreground"
                >
                  <EditIcon className="h-3.5 w-3.5 text-text-muted" />
                  <span>Edit Metadata</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleDuplicate}
                  className="text-xs gap-2 cursor-pointer focus:bg-surface-03 focus:text-foreground"
                >
                  <CopyIcon className="h-3.5 w-3.5 text-text-muted" />
                  <span>Duplicate</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleToggleArchive}
                  className="text-xs gap-2 cursor-pointer focus:bg-surface-03 focus:text-foreground"
                >
                  <ArchiveIcon className="h-3.5 w-3.5 text-text-muted" />
                  <span>{isArchived ? "Restore Project" : "Archive Project"}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border-subtle" />

                <DropdownMenuItem
                  onClick={() => onDelete(project)}
                  className="text-xs gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <TrashIcon className="h-3.5 w-3.5 text-destructive" />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Link href={`/workspace?project=${project.id}`} className="block focus-visible:outline-none">
          <CardDescription className="text-xs text-text-muted line-clamp-2 mt-2 leading-relaxed h-8">
            {project.description || "No description provided."}
          </CardDescription>
        </Link>
      </CardHeader>

      <CardContent className="px-4 sm:px-5 pb-4 pt-0">
        <div className="flex items-center justify-between border-t border-border-subtle pt-2.5 text-[11px] font-mono text-text-muted">
          <span className="truncate pr-2">{visualizerMeta.label}</span>
          <span className="shrink-0">{formattedDate}</span>
        </div>
      </CardContent>
    </Card>
  );
}

