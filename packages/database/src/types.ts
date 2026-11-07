export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";
export type ProjectRole = "editor" | "viewer";
export type ThemeMode = "dark" | "light" | "system";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          theme_mode: ThemeMode;
          accent_color: string;
          custom_accent_hex: string | null;
          font_size: string;
          reduced_motion: boolean;
          updated_at: string;
        };
        Insert: {
          id: string;
          theme_mode?: ThemeMode;
          accent_color?: string;
          custom_accent_hex?: string | null;
          font_size?: string;
          reduced_motion?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          theme_mode?: ThemeMode;
          accent_color?: string;
          custom_accent_hex?: string | null;
          font_size?: string;
          reduced_motion?: boolean;
          updated_at?: string;
        };
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: WorkspaceRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: WorkspaceRole;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          visualizer_type: string;
          graph_document: Json;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          visualizer_type: string;
          graph_document?: Json;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          graph_document?: Json;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: ProjectRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: ProjectRole;
          created_at?: string;
        };
        Update: {
          role?: ProjectRole;
        };
      };
      audit_events: {
        Row: {
          id: string;
          workspace_id: string;
          actor_id: string;
          event_type: string;
          target_type: string;
          target_id: string;
          payload: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          actor_id: string;
          event_type: string;
          target_type: string;
          target_id: string;
          payload?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: never;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_workspace_member: {
        Args: { ws_id: string };
        Returns: boolean;
      };
      is_workspace_admin: {
        Args: { ws_id: string };
        Returns: boolean;
      };
    };
  };
}
