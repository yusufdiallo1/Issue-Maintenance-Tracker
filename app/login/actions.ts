"use server";

// ============================================================
// Auth server actions — sign in / sign out.
// Username-only UI: we convert the username to its synthetic email
// before calling Supabase Auth. The email is never exposed.
// ============================================================
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { usernameToEmail } from "@/lib/auth";

export type SignInState = { error: boolean };

export async function signInAction(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: true };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error || !data.user) return { error: true };

  // Write a 'login' audit row (service role — actor_name snapshot).
  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", data.user.id)
      .single();
    await admin.from("audit_log").insert({
      actor: data.user.id,
      actor_name: profile?.full_name ?? username,
      action: "login",
    });
  } catch {
    // Auditing a login must never block sign-in.
  }

  redirect("/");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
