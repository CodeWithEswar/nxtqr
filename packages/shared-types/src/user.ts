import type { UserThemePreferences } from "./theme";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences extends UserThemePreferences {
  id: string;
  updatedAt: string;
}
