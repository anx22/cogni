// =============================================================================
//  Generic app-settings types. Backed by the public.app_settings table.
// =============================================================================

export type SettingScope = "global" | "user";

export interface SettingRow<T = unknown> {
  namespace: string;
  key: string;
  value: T;
  scope: SettingScope;
  user_id: string | null;
  updated_by: string | null;
  updated_at: string;
}
