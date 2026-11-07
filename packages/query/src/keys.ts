export const queryKeys = {
  auth: {
    session: ["auth", "session"] as const,
    user: ["auth", "user"] as const,
  },
  user: {
    profile: (userId: string) => ["user", "profile", userId] as const,
    preferences: (userId: string) => ["user", "preferences", userId] as const,
  },
  workspaces: {
    all: ["workspaces"] as const,
    detail: (slug: string) => ["workspaces", slug] as const,
    members: (workspaceId: string) => ["workspaces", workspaceId, "members"] as const,
  },
  projects: {
    list: (workspaceId: string) => ["projects", { workspaceId }] as const,
    detail: (projectId: string) => ["projects", projectId] as const,
  },
  visualizer: {
    definition: (type: string) => ["visualizer", "definition", type] as const,
  },
} as const;
