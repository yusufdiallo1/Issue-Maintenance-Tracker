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
import type { Lang } from "@/lib/i18n/dictionary";

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
  lang: Lang;
};
export type CreateReportResult =
  | { ok: true; id: number; count: number }
  | { ok: false; error: string };

/** Create a new issue (reported_by = me, created_at = now) + 'report' audit. */
export async function createReport(input: CreateReportInput): Promise<CreateReportResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "unauthenticated" };
  if (!input.property || !input.type || !input.urgency) {
    return { ok: false, error: "missing_fields" };
  }

  const { translateAll, detectLang } = await import("@/lib/translate");
  const { splitProblems } = await import("@/lib/split");

  // One spoken/typed note may describe SEVERAL problems → split into one issue
  // each (same room/property/photos/tags). A single problem returns one entry.
  const problems = await splitProblems(input.description || "", input.type, input.urgency);

  // Translate CUSTOM tag labels (custom:<label>) into all 4 languages once.
  const tagTranslations: Record<string, Record<string, string>> = {};
  const customLabels = (input.tags ?? [])
    .filter((tg) => tg.startsWith("custom:"))
    .map((tg) => tg.slice(7));
  if (customLabels.length) {
    await Promise.all(
      customLabels.map(async (label) => {
        tagTranslations[label] = (await translateAll(label, detectLang(label))) as Record<
          string,
          string
        >;
      }),
    );
  }

  const supabase = await createClient();
  const createdIds: number[] = [];

  for (const p of problems) {
    const base = p.description;
    const source = base ? detectLang(base) : input.lang;
    const translations = base ? await translateAll(base, source) : {};
    const ar = translations.ar ?? base;

    const { data, error } = await supabase
      .from("issues")
      .insert({
        property: input.property,
        room: input.room ?? "",
        type: p.type,
        urgency: p.urgency,
        status: "open",
        description: base,
        description_ar: ar,
        source_language: source,
        description_translations: translations,
        tag_translations: tagTranslations,
        tags: input.tags ?? [],
        photo_paths: input.photoPaths ?? [],
        photo_path: input.photoPaths?.[0] ?? null,
        reported_by: me.id,
      })
      .select("id")
      .single();
    if (error || !data) {
      if (createdIds.length) break; // keep the ones that already succeeded
      return { ok: false, error: error?.message ?? "insert_failed" };
    }
    createdIds.push(data.id);

    // Notify EVERY other user of each new issue (push + bell). Fire-and-forget.
    const isSafety = (input.tags ?? []).includes("safety");
    const isUrgent = p.urgency === "urgent" || isSafety;
    const issueId = data.id;
    void (async () => {
      try {
        const { sendPushToAllExcept } = await import("@/lib/push");
        const admin = createAdminClient();
        const where = `${propLabelEn(input.property)}${input.room ? " " + input.room : ""}`;
        const title = `${isSafety ? "⚠️ " : isUrgent ? "🔴 " : ""}New issue · ${where}`;
        const body = `${p.type} · ${p.urgency} — ${base}`.trim().slice(0, 140);
        const { data: recipients } = await admin.from("profiles").select("id").neq("id", me.id);
        const ids = (recipients ?? []).map((r) => r.id);
        if (ids.length) {
          await admin.from("notifications").insert(
            ids.map((uid) => ({
              user_id: uid,
              kind: isSafety ? "safety" : isUrgent ? "urgent" : "new",
              issue_id: issueId,
              title,
              body,
            })),
          );
        }
        await sendPushToAllExcept(me.id, {
          title,
          body,
          url: `/?issue=${issueId}`,
          tag: `issue-${issueId}`,
          urgent: isUrgent,
        });
      } catch {
        /* ignore */
      }
    })();
  }

  if (!createdIds.length) return { ok: false, error: "insert_failed" };

  await writeAudit(me.id, me.full_name, {
    action: "report",
    property: input.property,
    room: input.room ?? "",
  });

  revalidatePath("/");
  return { ok: true, id: createdIds[0], count: createdIds.length };
}

function propLabelEn(code: string): string {
  const map: Record<string, string> = {
    as_salaam: "Al-Salam",
    al_aqeeq: "Al-Aqeeq",
    quba: "Quba",
    al_shaqqa: "The Apartment",
    al_villa: "The Villa",
  };
  return map[code] ?? code;
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

  // One active issue per worker: block if they already hold one in
  // progress/pending. (A unique partial index is the DB-level backstop.)
  const { count: active } = await supabase
    .from("issues")
    .select("id", { count: "exact", head: true })
    .eq("taken_by", me.id)
    .in("status", ["progress", "pending"]);
  if ((active ?? 0) > 0) return { ok: false, error: "one_at_a_time" };

  const { error } = await supabase
    .from("issues")
    .update({ taken_by: me.id, status: "progress" })
    .eq("id", issueId);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "one_at_a_time" };
    return { ok: false, error: error.message };
  }

  await writeAudit(me.id, me.full_name, {
    action: "take",
    property: issue.property,
    room: issue.room,
  });
  revalidatePath("/");
  return { ok: true };
}

/**
 * Submit a completion for review: the worker uploads proof photo(s) + a note of
 * what was fixed. Status → 'pending' (awaiting an admin's approval). Admins are
 * notified (push + bell). Legacy `markDone` (offline outbox fallback) below.
 */
export async function submitCompletion(
  issueId: number,
  proof: { proofPaths: string[]; note: string; lang: Lang },
): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "unauthenticated" };
  if (!proof.proofPaths?.length) return { ok: false, error: "proof_required" };
  const supabase = await createClient();

  const { data: issue } = await supabase
    .from("issues")
    .select("property, room, taken_by")
    .eq("id", issueId)
    .single();
  if (!issue) return { ok: false, error: "not_found" };
  if (issue.taken_by !== me.id && me.role !== "admin") {
    return { ok: false, error: "not_owner" };
  }

  const { error } = await supabase
    .from("issues")
    .update({
      status: "pending",
      proof_paths: proof.proofPaths,
      proof_note: proof.note || null,
      proof_note_lang: proof.lang,
      done_by: me.id,
      done_at: new Date(Date.now()).toISOString(),
    })
    .eq("id", issueId);
  if (error) return { ok: false, error: error.message };

  // Notify admins that a completion needs approval (push + bell).
  void (async () => {
    try {
      const { sendPushToUsers, adminUserIds } = await import("@/lib/push");
      const admin = createAdminClient();
      const where = `${propLabelEn(issue.property)}${issue.room ? " " + issue.room : ""}`;
      const title = `✅ Awaiting approval · ${where}`;
      const body = (proof.note || "Completion submitted").slice(0, 140);
      const admins = (await adminUserIds()).filter((id) => id !== me.id);
      if (admins.length) {
        await admin.from("notifications").insert(
          admins.map((uid) => ({
            user_id: uid,
            kind: "new" as const,
            issue_id: issueId,
            title,
            body,
          })),
        );
        await sendPushToUsers(admins, {
          title,
          body,
          url: `/?issue=${issueId}`,
          tag: `issue-${issueId}`,
        });
      }
    } catch {
      /* ignore */
    }
  })();

  revalidatePath("/");
  return { ok: true };
}

/** Admin approves a pending completion → status done, resolved_at/minutes set. */
export async function approveCompletion(issueId: number): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (!me || me.role !== "admin") return { ok: false, error: "forbidden" };
  const supabase = await createClient();

  const { data: issue } = await supabase
    .from("issues")
    .select("property, room, created_at, done_by")
    .eq("id", issueId)
    .single();
  if (!issue) return { ok: false, error: "not_found" };

  const now = Date.now();
  const resolvedMinutes = Math.max(
    0,
    Math.round((now - new Date(issue.created_at).getTime()) / 60000),
  );
  const { error } = await supabase
    .from("issues")
    .update({
      status: "done",
      approved_by: me.id,
      approved_at: new Date(now).toISOString(),
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
  // Tell the worker their fix was approved.
  if (issue.done_by && issue.done_by !== me.id) {
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      user_id: issue.done_by,
      kind: "new",
      issue_id: issueId,
      title: "✅ Completion approved",
      body: `${propLabelEn(issue.property)}${issue.room ? " " + issue.room : ""}`,
    });
  }
  revalidatePath("/");
  return { ok: true };
}

/** Admin rejects a pending completion → back to progress with a reason. */
export async function rejectCompletion(issueId: number, reason: string): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (!me || me.role !== "admin") return { ok: false, error: "forbidden" };
  const supabase = await createClient();

  const { data: issue } = await supabase
    .from("issues")
    .select("property, room, done_by")
    .eq("id", issueId)
    .single();
  if (!issue) return { ok: false, error: "not_found" };

  const { error } = await supabase
    .from("issues")
    .update({ status: "progress", reject_reason: reason || null, done_at: null })
    .eq("id", issueId);
  if (error) return { ok: false, error: error.message };

  if (issue.done_by && issue.done_by !== me.id) {
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      user_id: issue.done_by,
      kind: "urgent",
      issue_id: issueId,
      title: "↩︎ Completion needs more work",
      body: (reason || `${propLabelEn(issue.property)} ${issue.room}`).slice(0, 140),
    });
  }
  revalidatePath("/");
  return { ok: true };
}

/** Legacy direct mark-done (offline outbox fallback only — no proof/approval). */
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

/** Pin / unpin an issue so it sorts to the very top of the Reports list. */
export async function togglePin(issueId: number, pinned: boolean): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "unauthenticated" };
  const supabase = await createClient();
  const { error } = await supabase.from("issues").update({ pinned }).eq("id", issueId);
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
