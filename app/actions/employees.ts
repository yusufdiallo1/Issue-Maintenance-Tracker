"use server";

// ============================================================
// Admin-only user management. Uses the SERVICE ROLE key (bypasses RLS)
// and is guarded so only an admin caller can run it.
// ============================================================
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/session";
import { usernameToEmail } from "@/lib/auth";

export type EmployeeResult = { ok: boolean; error?: string };

/** Create an auth user (synthetic email) + matching profile. Admin only. */
export async function addEmployee(input: {
  fullName: string;
  username: string;
  password: string;
  role: "admin" | "staff";
  language?: "ar" | "en" | "bn" | "ur";
  properties?: string[];
  title?: string | null;
}): Promise<EmployeeResult> {
  const me = await getCurrentProfile();
  if (!me || me.role !== "admin") return { ok: false, error: "forbidden" };

  const fullName = input.fullName.trim();
  const username = input.username.trim().toLowerCase();
  const password = input.password;
  const language = input.language ?? "ar";
  const properties = (input.properties ?? []).filter(Boolean);
  const title = input.title?.trim() || null;
  if (!fullName || !username || !password) {
    return { ok: false, error: "missing_fields" };
  }
  if (input.role !== "admin" && input.role !== "staff") {
    return { ok: false, error: "bad_role" };
  }
  if (!["ar", "en", "bn", "ur"].includes(language)) {
    return { ok: false, error: "bad_language" };
  }

  const admin = createAdminClient();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
    user_metadata: { username, full_name: fullName },
  });
  if (createErr || !created.user) {
    // Most common: username (email) already exists.
    return { ok: false, error: createErr?.message ?? "create_failed" };
  }

  const { error: profErr } = await admin.from("profiles").insert({
    id: created.user.id,
    username,
    full_name: fullName,
    role: input.role,
    preferred_language: language,
    properties,
    title,
  });
  if (profErr) {
    // Roll back the orphaned auth user so the username stays free.
    await admin.auth.admin.deleteUser(created.user.id);
    return { ok: false, error: profErr.message };
  }

  await admin.from("audit_log").insert({
    actor: me.id,
    actor_name: me.full_name,
    action: "addemp",
    target_text: fullName,
  });

  revalidatePath("/");
  return { ok: true };
}

/** Change a user's role (admin↔staff). Admin only; cannot change self. */
export async function changeRole(userId: string, role: "admin" | "staff"): Promise<EmployeeResult> {
  const me = await getCurrentProfile();
  if (!me || me.role !== "admin") return { ok: false, error: "forbidden" };
  if (userId === me.id) return { ok: false, error: "cannot_change_self" };
  if (role !== "admin" && role !== "staff") return { ok: false, error: "bad_role" };

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  await admin.from("audit_log").insert({
    actor: me.id,
    actor_name: me.full_name,
    action: "role",
    target_text: `${target?.full_name ?? ""} → ${role}`,
  });
  revalidatePath("/");
  return { ok: true };
}

/** Set a new password for a user. Admin only. */
export async function resetPassword(userId: string, password: string): Promise<EmployeeResult> {
  const me = await getCurrentProfile();
  if (!me || me.role !== "admin") return { ok: false, error: "forbidden" };
  if (!password || password.length < 6) return { ok: false, error: "weak_password" };

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { ok: false, error: error.message };

  await admin.from("audit_log").insert({
    actor: me.id,
    actor_name: me.full_name,
    action: "pwreset",
    target_text: target?.full_name ?? null,
  });
  revalidatePath("/");
  return { ok: true };
}

/**
 * A user changes their OWN passcode. On success, every admin is notified and an
 * audit row records the new passcode so an admin can view it (per the product
 * requirement). The audit log is admin-only via RLS — see the security note.
 */
export async function changeOwnPassword(password: string): Promise<EmployeeResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "unauthenticated" };
  if (!password || password.length < 6) return { ok: false, error: "weak_password" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(me.id, { password });
  if (error) return { ok: false, error: error.message };

  // Audit row stores the new passcode in target_text (admin-viewable drill-in).
  await admin.from("audit_log").insert({
    actor: me.id,
    actor_name: me.full_name,
    action: "passcode",
    target_text: password,
  });

  // Notify every admin (except self) via the in-app bell.
  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
  const ids = (admins ?? []).map((a) => a.id).filter((id) => id !== me.id);
  if (ids.length) {
    await admin.from("notifications").insert(
      ids.map((uid) => ({
        user_id: uid,
        kind: "new" as const,
        title: "🔑 Passcode changed",
        body: `${me.full_name} changed their passcode`,
      })),
    );
  }
  revalidatePath("/");
  return { ok: true };
}

/** Delete an auth user + profile. Admin only; cannot remove self. */
export async function removeEmployee(userId: string): Promise<EmployeeResult> {
  const me = await getCurrentProfile();
  if (!me || me.role !== "admin") return { ok: false, error: "forbidden" };
  if (userId === me.id) return { ok: false, error: "cannot_remove_self" };

  const admin = createAdminClient();

  // Snapshot the name for the audit row before deleting.
  const { data: target } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  // Deleting the auth user cascades to the profile (FK on delete cascade).
  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) return { ok: false, error: delErr.message };

  await admin.from("audit_log").insert({
    actor: me.id,
    actor_name: me.full_name,
    action: "rmemp",
    target_text: target?.full_name ?? null,
  });

  revalidatePath("/");
  return { ok: true };
}
