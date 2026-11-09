"use client";

import * as React from "react";
import {
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  Skeleton,
} from "@nxtqr/ui";
import { PlusIcon, SearchIcon, FolderIcon } from "@nxtqr/icons";
import { useProjectsQuery } from "../hooks/use-projects";
import type { Project, ProjectStatus } from "../schemas/project.schema";
import { ProjectCard } from "./project-card";
import { CreateProjectDialog } from "./create-project-dialog";
import { EditProjectDialog } from "./edit-project-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";

export function ProjectList() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | ProjectStatus>("active");
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = React.useState<Project | null>(null);

  const { data, isLoading } = useProjectsQuery({
    search: searchTerm.trim() || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50,
    offset: 0,
  });

  const projects = data?.projects || [];
  const totalCount = data?.total ?? 0;

  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scrollbar-thin select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="font-sans text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Workspace Projects
            </h1>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-border-default bg-surface-02 text-text-muted">
              {totalCount} total
            </span>
          </div>
          <p className="font-sans text-xs text-text-muted">
            Manage your persistent engineering diagrams, system architectures, and simulation graphs.
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setCreateDialogOpen(true)}
          className="h-8 px-3 font-sans text-xs gap-1.5 rounded-md bg-foreground text-background hover:bg-neutral-200 shrink-0 self-start sm:self-auto"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
          <Input
            type="search"
            placeholder="Search projects by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-8 pr-3 text-xs rounded-md border-border-default bg-surface-02 text-foreground focus:border-border-strong"
          />
        </div>

        <Tabs
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as any)}
          className="w-auto"
        >
          <TabsList className="h-8 rounded-md bg-surface-02 border border-border-default p-0.5">
            <TabsTrigger
              value="active"
              className="h-7 px-3 text-xs rounded-md data-[state=active]:bg-surface-04 data-[state=active]:text-foreground data-[state=active]:shadow-level-1 text-text-muted font-sans"
            >
              Active
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              className="h-7 px-3 text-xs rounded-md data-[state=active]:bg-surface-04 data-[state=active]:text-foreground data-[state=active]:shadow-level-1 text-text-muted font-sans"
            >
              Archived
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="h-7 px-3 text-xs rounded-md data-[state=active]:bg-surface-04 data-[state=active]:text-foreground data-[state=active]:shadow-level-1 text-text-muted font-sans"
            >
              All
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Project Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-md border border-border-default bg-surface-01 p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-md bg-surface-03" />
                <Skeleton className="h-4 w-32 rounded bg-surface-03" />
              </div>
              <Skeleton className="h-10 w-full rounded bg-surface-03" />
              <div className="border-t border-border-subtle pt-2 flex justify-between">
                <Skeleton className="h-3 w-20 rounded bg-surface-03" />
                <Skeleton className="h-3 w-14 rounded bg-surface-03" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-md border border-dashed border-border-default bg-surface-01 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-02 border border-border-default text-text-muted">
            <FolderIcon className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">No projects found</h3>
            <p className="text-xs text-text-muted max-w-sm">
              {searchTerm
                ? `No engineering projects match "${searchTerm}".`
                : statusFilter === "archived"
                ? "No archived projects in your workspace."
                : "Get started by creating your first system architecture or simulation graph."}
            </p>
          </div>
          {!searchTerm && statusFilter !== "archived" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCreateDialogOpen(true)}
              className="mt-2 h-8 px-3 text-xs rounded-md border-border-default bg-surface-02 hover:bg-surface-03 text-foreground gap-1.5"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Create Project</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <ProjectCard
              key={proj.id}
              project={proj}
              onEdit={setEditingProject}
              onDelete={setDeletingProject}
            />
          ))}
        </div>
      )}

      {/* Creation, Edit, Delete Modals */}
      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditProjectDialog
        project={editingProject}
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
      />

      <DeleteProjectDialog
        project={deletingProject}
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
      />
    </div>
  );
}

