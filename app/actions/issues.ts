"use server";

// ============================================================
// Issue lifecycle actions: take / mark done / reopen / set+clear deadline.
// Each runs as the signed-in user (RLS applies). Every state change writes
// the matching audit row (actor + target + time). Deadline changes are
// admin-only — enforced by the DB trigger AND guarded here for a clean error.
// ============================================================
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/session";
import type { Deadline } from "@/lib/issues";

export type ActionResult = { ok: boolean; error?: string };

export type CreateReportInput = {
  property: string;
  room: string;
  type: string;
  urgency: "urgent" | "soon" | "wait";
  description: string;
  descriptionAr: string;
  tags: string[];
  photoPaths: string[];
  lang: "en" | "ar";
};
export type CreateReportResult = { ok: true; id: number } | { ok: false; error: string };

/**
 * Translate a short text to the target language via Groq. Returns "" on any
 * failure so translation is never blocking.
 */
async function translateText(text: string, to: "en" | "ar"): Promise<string> {
  if (!text.trim()) return "";
  try {
    const { groq } = await import("@/lib/groq/server");
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `Translate the user's maintenance note to ${to === "ar" ? "Arabic" : "English"}. Output ONLY the translation, no quotes or notes.`,
        },
        { role: "user", content: text },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() ?? "";
  } catch {
    return "";
  }
}

/** Create a new issue (reported_by = me, created_at = now) + 'report' audit. */
export async function createReport(input: CreateReportInput): Promise<CreateReportResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "unauthenticated" };
  if (!input.property || !input.type || !input.urgency) {
    return { ok: false, error: "missing_fields" };
  }

  // Store the description in BOTH languages so cards read correctly either way.
  const base = input.description || "";
  let en = input.lang === "en" ? base : "";
  let ar = input.lang === "ar" ? base : "";
  if (base) {
    if (!en) en = (await translateText(base, "en")) || base;
    if (!ar) ar = (await translateText(base, "ar")) || base;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issues")
    .insert({
      property: input.property,
      room: input.room ?? "",
      type: input.type,
      urgency: input.urgency,
      status: "open",
      description: en,
      description_ar: ar,
      tags: input.tags ?? [],
      photo_paths: input.photoPaths ?? [],
      photo_path: input.photoPaths?.[0] ?? null,
      reported_by: me.id,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };

  await writeAudit(me.id, me.full_name, {
    action: "report",
    property: input.property,
    room: input.room ?? "",
  });
  revalidatePath("/");
  return { ok: true, id: data.id };
}

type AuditInput = {
  action: "take" | "done" | "deadline" | "report";
  property: string;
  room: string;
};

async function writeAudit(actorId: string, actorName: string, input: AuditInput) {
  // Audit writes go through the service role (actor_name is a snapshot).
  const admin = createAdminClient();
  await admin.from("audit_log").insert({
    actor: actorId,
    actor_name: actorName,
    action: input.action,
    target_property: input.property,
    target_room: input.room,
  });
}

/** Claim an unassigned issue: taken_by = me, status = in progress. */
export async function takeIssue(issueId: number): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "unauthenticated" };
  const supabase = await createClient();

  const { data: issue } = await supabase
    .from("issues")
    .select("property, room, taken_by, status")
    .eq("id", issueId)
    .single();
  if (!issue) return { ok: false, error: "not_found" };
  if (issue.taken_by) return { ok: false, error: "already_taken" };

  const { error } = await supabase
    .from("issues")
    .update({ taken_by: me.id, status: "progress" })
    .eq("id", issueId);
  if (error) return { ok: false, error: error.message };

  await writeAudit(me.id, me.full_name, {
    action: "take",
    property: issue.property,
    room: issue.room,
  });
  revalidatePath("/");
  return { ok: true };
}

/** Mark an issue I own as done: status done, resolved_at = now, resolved_minutes. */
export async function markDone(issueId: number): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "unauthenticated" };
  const supabase = await createClient();

  const { data: issue } = await supabase
    .from("issues")
    .select("property, room, taken_by, created_at")
    .eq("id", issueId)
    .single();
  if (!issue) return { ok: false, error: "not_found" };
  if (issue.taken_by !== me.id && me.role !== "admin") {
    return { ok: false, error: "not_owner" };
  }

  const now = Date.now();
  const resolvedMinutes = Math.max(
    0,
    Math.round((now - new Date(issue.created_at).getTime()) / 60000),
  );
  const { error } = await supabase
    .from("issues")
    .update({
      status: "done",
      resolved_at: new Date(now).toISOString(),
      resolved_minutes: resolvedMinutes,
    })
    .eq("id", issueId);
  if (error) return { ok: false, error: error.message };

  await writeAudit(me.id, me.full_name, {
    action: "done",
    property: issue.property,
    room: issue.room,
  });
  revalidatePath("/");
  return { ok: true };
}

/** Reopen a done issue (owner or admin): back to progress if owned, else open. */
export async function reopenIssue(issueId: number): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "unauthenticated" };
  const supabase = await createClient();

  const { data: issue } = await supabase
    .from("issues")
    .select("taken_by, status")
    .eq("id", issueId)
    .single();
  if (!issue) return { ok: false, error: "not_found" };
  if (issue.taken_by !== me.id && me.role !== "admin") {
    return { ok: false, error: "forbidden" };
  }

  const { error } = await supabase
    .from("issues")
    .update({
      status: issue.taken_by ? "progress" : "open",
      resolved_at: null,
      resolved_minutes: null,
    })
    .eq("id", issueId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true };
}

/** Admin only: set an issue's deadline; writes a 'deadline' audit row. */
export async function setDeadline(issueId: number, deadline: Deadline): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "unauthenticated" };
  if (me.role !== "admin") return { ok: false, error: "forbidden" };
  const supabase = await createClient();

  const { data: issue } = await supabase
    .from("issues")
    .select("property, room")
    .eq("id", issueId)
    .single();
  if (!issue) return { ok: false, error: "not_found" };

  const { error } = await supabase.from("issues").update({ deadline }).eq("id", issueId);
  if (error) return { ok: false, error: error.message };

  await writeAudit(me.id, me.full_name, {
    action: "deadline",
    property: issue.property,
    room: issue.room,
  });
  revalidatePath("/");
  return { ok: true };
}

/** Admin only: clear an issue's deadline. */
export async function clearDeadline(issueId: number): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "unauthenticated" };
  if (me.role !== "admin") return { ok: false, error: "forbidden" };
  const supabase = await createClient();

  const { error } = await supabase.from("issues").update({ deadline: null }).eq("id", issueId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true };
}
