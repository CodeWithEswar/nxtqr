"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectRepository } from "../repositories/project-repository";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilterInput,
} from "../schemas/project.schema";

export const PROJECT_KEYS = {
  all: ["projects"] as const,
  lists: () => [...PROJECT_KEYS.all, "list"] as const,
  list: (filter: ProjectFilterInput) => [...PROJECT_KEYS.lists(), filter] as const,
  details: () => [...PROJECT_KEYS.all, "detail"] as const,
  detail: (id: string) => [...PROJECT_KEYS.details(), id] as const,
};

export function useProjectsQuery(filter: ProjectFilterInput = { limit: 20, offset: 0 }) {
  return useQuery({
    queryKey: PROJECT_KEYS.list(filter),
    queryFn: () => projectRepository.list(filter),
    staleTime: 1000 * 30, // 30s
  });
}

export function useProjectQuery(id: string) {
  return useQuery({
    queryKey: PROJECT_KEYS.detail(id),
    queryFn: () => projectRepository.getById(id),
    enabled: !!id,
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectRepository.create(input),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      toast.success(`Project "${newProject.name}" created.`);
    },
    onError: (err: any) => {
      toast.error(err.userMessage || err.message || "Failed to create project.");
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateProjectInput }) =>
      projectRepository.update(id, updates),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      toast.success(`Project "${updated.name}" updated.`);
    },
    onError: (err: any) => {
      toast.error(err.userMessage || err.message || "Failed to update project.");
    },
  });
}

export function useDuplicateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectRepository.duplicate(id),
    onSuccess: (copy) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      toast.success(`Duplicated as "${copy.name}".`);
    },
    onError: (err: any) => {
      toast.error(err.userMessage || err.message || "Failed to duplicate project.");
    },
  });
}

export function useArchiveProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectRepository.archive(id),
    onSuccess: (archived) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      toast.success(`Project "${archived.name}" archived.`);
    },
    onError: (err: any) => {
      toast.error(err.userMessage || err.message || "Failed to archive project.");
    },
  });
}

export function useRestoreProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectRepository.restore(id),
    onSuccess: (restored) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      toast.success(`Project "${restored.name}" restored.`);
    },
    onError: (err: any) => {
      toast.error(err.userMessage || err.message || "Failed to restore project.");
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      toast.success("Project deleted.");
    },
    onError: (err: any) => {
      toast.error(err.userMessage || err.message || "Failed to delete project.");
    },
  });
}

