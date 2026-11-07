import type { WorkspaceRole, ProjectRole } from "@nxtqr/shared-types";

export function canManageWorkspaceMembers(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}

export function canDeleteWorkspace(role: WorkspaceRole): boolean {
  return role === "owner";
}

export function canCreateProjects(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin" || role === "member";
}

export function canEditProject(workspaceRole: WorkspaceRole, projectRole?: ProjectRole): boolean {
  if (workspaceRole === "owner" || workspaceRole === "admin") return true;
  if (workspaceRole === "viewer") return false;
  return projectRole === "editor";
}
