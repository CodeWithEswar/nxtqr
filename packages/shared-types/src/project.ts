export type ProjectRole = "editor" | "viewer";

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  visualizerType: string;
  graphDocument: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  createdAt: string;
}
