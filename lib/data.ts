// Server-side data fetching for the Reports screen.
import { createClient } from "@/lib/supabase/server";
import type { Issue } from "@/lib/issues";
import type { Database } from "@/lib/database.types";

export type ProfileLite = { id: string; full_name: string; username: string };
export type ProfileFull = Database["public"]["Tables"]["profiles"]["Row"];
export type AuditRow = Database["public"]["Tables"]["audit_log"]["Row"];

/** All issues, newest first. */
export async function fetchIssues(): Promise<Issue[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** All profiles, as a lookup for resolving reporter / taker names. */
export async function fetchProfiles(): Promise<ProfileLite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, full_name, username");
  if (error) throw error;
  return data ?? [];
}

/** Full profiles (admin team list), ordered by name. */
export async function fetchTeam(): Promise<ProfileFull[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").order("full_name");
  if (error) throw error;
  return data ?? [];
}

/** Recent audit log rows (admin), newest first. */
export async function fetchAudit(limit = 20): Promise<AuditRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
