import { createBrowserClient } from "@nxtqr/database/client";
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilterInput,
} from "../schemas/project.schema";
import { AppError } from "@/features/auth/lib/auth-errors";

function mapDbRowToProject(row: any): Project {
  const status =
    row.status ??
    (row.graph_document && typeof row.graph_document === "object" ? row.graph_document.status : undefined) ??
    "active";

  return {
    id: row.id,
    ownerId: row.owner_id || row.created_by,
    name: row.name,
    description: row.description || null,
    visualizerType: row.visualizer_type,
    status: status === "archived" ? "archived" : "active",
    workspaceId: row.workspace_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ProjectRepository {
  private client = createBrowserClient();

  private async requireUserId(): Promise<string> {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser();

    if (error || !user) {
      throw new AppError("AUTH_SESSION_EXPIRED", "Authentication session required for project operations.");
    }

    return user.id;
  }

  private async ensureDefaultWorkspaceId(userId: string): Promise<string> {
    // Check if user has an existing workspace
    const { data: memberRow } = await this.client
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (memberRow?.workspace_id) {
      return memberRow.workspace_id;
    }

    // Auto-create personal workspace if none exists
    const slug = `personal-${userId.slice(0, 8)}`;
    const { data: createdWs, error: wsError } = await this.client
      .from("workspaces")
      .insert({
        name: "Personal Workspace",
        slug,
        created_by: userId,
      })
      .select()
      .single();

    if (createdWs) {
      // Add membership
      await this.client.from("workspace_members").insert({
        workspace_id: createdWs.id,
        user_id: userId,
        role: "owner",
      });
      return createdWs.id;
    }

    throw new AppError("RESOURCE_NOT_FOUND", wsError?.message || "Unable to resolve default workspace.");
  }

  async list(filter: ProjectFilterInput = { limit: 20, offset: 0 }): Promise<{ projects: Project[]; total: number }> {
    const userId = await this.requireUserId();

    let query = this.client
      .from("projects")
      .select("*", { count: "exact" })
      .eq("created_by", userId);

    if (filter.search) {
      query = query.ilike("name", `%${filter.search}%`);
    }

    const { data, count, error } = await query
      .order("updated_at", { ascending: false })
      .range(filter.offset, filter.offset + filter.limit - 1);

    if (error) {
      throw new AppError("RESOURCE_NOT_FOUND", error.message);
    }

    const mapped = (data || []).map(mapDbRowToProject);

    // Apply status filter in-memory if stored in graph_document
    const filtered = filter.status
      ? mapped.filter((p) => p.status === filter.status)
      : mapped;

    return {
      projects: filtered,
      total: count ?? filtered.length,
    };
  }

  async getById(id: string): Promise<Project> {
    const userId = await this.requireUserId();

    const { data, error } = await this.client
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new AppError("RESOURCE_NOT_FOUND", "Project not found.");
    }

    const project = mapDbRowToProject(data);
    if (project.ownerId !== userId) {
      throw new AppError("PERMISSION_DENIED", "You do not have permission to view this project.");
    }

    return project;
  }

  async create(input: CreateProjectInput): Promise<Project> {
    const userId = await this.requireUserId();
    const workspaceId = input.workspaceId || (await this.ensureDefaultWorkspaceId(userId));

    const insertPayload: any = {
      name: input.name,
      description: input.description || null,
      visualizer_type: input.visualizerType,
      workspace_id: workspaceId,
      created_by: userId,
      graph_document: {
        status: "active",
        nodes: [],
        edges: [],
      },
    };

    const { data, error } = await this.client
      .from("projects")
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      throw new AppError("UNKNOWN_ERROR", error?.message || "Failed to create project.");
    }

    return mapDbRowToProject(data);
  }

  async update(id: string, updates: UpdateProjectInput): Promise<Project> {
    const userId = await this.requireUserId();

    const existing = await this.getById(id);
    if (existing.ownerId !== userId) {
      throw new AppError("PERMISSION_DENIED", "You do not have permission to modify this project.");
    }

    const updatePayload: any = {};
    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.description !== undefined) updatePayload.description = updates.description;

    if (updates.status !== undefined || updates.graphDocument !== undefined) {
      updatePayload.graph_document = {
        ...(existing as any).graph_document,
        ...(updates.graphDocument || {}),
        status: updates.status ?? existing.status,
      };
    }

    const { data, error } = await this.client
      .from("projects")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError("UNKNOWN_ERROR", error?.message || "Failed to update project.");
    }

    return mapDbRowToProject(data);
  }

  async duplicate(id: string): Promise<Project> {
    const existing = await this.getById(id);
    return this.create({
      name: `${existing.name} (Copy)`,
      description: existing.description || undefined,
      visualizerType: existing.visualizerType as any,
      workspaceId: existing.workspaceId || undefined,
    });
  }

  async archive(id: string): Promise<Project> {
    return this.update(id, { status: "archived" });
  }

  async restore(id: string): Promise<Project> {
    return this.update(id, { status: "active" });
  }

  async delete(id: string): Promise<void> {
    const userId = await this.requireUserId();

    const existing = await this.getById(id);
    if (existing.ownerId !== userId) {
      throw new AppError("PERMISSION_DENIED", "You do not have permission to delete this project.");
    }

    const { error } = await this.client
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      throw new AppError("UNKNOWN_ERROR", error.message);
    }
  }
}

export const projectRepository = new ProjectRepository();

