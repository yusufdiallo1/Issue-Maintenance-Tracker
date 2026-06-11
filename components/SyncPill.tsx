"use client";

// Global sync status pill + outbox flusher. Watches connectivity; when online,
// replays queued ops in order (idempotent via client UUID) by calling the same
// server actions. On success Supabase realtime broadcasts the change to every
// device, so no manual refresh is needed.
import { useCallback, useEffect, useState } from "react";
import { CloudOff, RefreshCw, Check } from "lucide-react";
import { useOnline } from "@/lib/useOnline";
import { useLang } from "@/app/providers";
import { allOps, removeOp, bumpTries, pendingCount, uuid, type OutboxOp } from "@/lib/outbox";
import { createClient } from "@/lib/supabase/client";
import {
  takeIssue,
  markDone,
  reopenIssue,
  setDeadline,
  clearDeadline,
  createReport,
} from "@/app/actions/issues";

type Sync = "idle" | "syncing" | "synced";

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Flush a queued offline create: upload its photo blobs, then create the issue. */
async function flushCreate(op: OutboxOp, supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("no_user");

  const photoPaths: string[] = [];
  for (const blob of op.photos ?? []) {
    const path = `${user.id}/${uuid()}.jpg`;
    const { error } = await supabase.storage
      .from("issue-photos")
      .upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    photoPaths.push(path);
  }

  const p = op.payload as Record<string, unknown>;
  const res = await createReport({
    property: p.property as string,
    room: (p.room as string) ?? "",
    type: p.type as string,
    urgency: p.urgency as "urgent" | "soon" | "wait",
    description: (p.description as string) ?? "",
    descriptionAr: "",
    tags: (p.tags as string[]) ?? [],
    photoPaths,
    lang: (p.lang as "en" | "ar" | "bn" | "ur") ?? "ar",
  });
  if (!res.ok) throw new Error("create_failed");
}

export function SyncPill() {
  const online = useOnline();
  const { t } = useLang();
  // Sync activity only; the offline display is derived from `online` in render.
  const [sync, setSync] = useState<Sync>("idle");
  const [count, setCount] = useState(0);

  const flush = useCallback(async () => {
    if (!navigator.onLine) return;
    const ops = await allOps();
    if (!ops.length) return;
    setSync("syncing");
    setCount(ops.length);
    const supabase = createClient();
    for (const op of ops) {
      try {
        if (op.kind === "create") {
          await flushCreate(op, supabase);
        } else {
          const id = op.payload.issueId as number;
          if (op.kind === "take") await takeIssue(id);
          else if (op.kind === "done") await markDone(id);
          else if (op.kind === "reopen") await reopenIssue(id);
          else if (op.kind === "deadline") {
            const dl = op.payload.deadline as "today" | "tomorrow" | "days3" | "week" | null;
            if (dl) await setDeadline(id, dl);
            else await clearDeadline(id);
          }
        }
        await removeOp(op.id);
      } catch {
        await bumpTries(op.id); // keep it queued; retry next flush (backoff)
      }
    }
    setCount(await pendingCount());
    setSync("synced");
    setTimeout(() => setSync("idle"), 2000);
  }, []);

  // Flush on reconnect + focus + a light poll. Deferred a tick so the async
  // outbox drain (real I/O) never runs synchronously within the effect.
  useEffect(() => {
    if (!online) return;
    const kick = () => void flush();
    const t0 = setTimeout(kick, 0);
    window.addEventListener("focus", kick);
    const poll = setInterval(kick, 20000);
    return () => {
      clearTimeout(t0);
      window.removeEventListener("focus", kick);
      clearInterval(poll);
    };
  }, [online, flush]);

  // What to show: offline takes precedence, then sync activity.
  const view = !online ? "offline" : sync;
  if (view === "idle") return null;

  const label =
    view === "offline"
      ? t("offline")
      : view === "syncing"
        ? `${t("syncing")}${count ? ` ${count}` : ""}`
        : t("allSynced");

  return (
    <div className={`sync-pill sync-${view}`} role="status" aria-live="polite">
      {view === "offline" ? (
        <CloudOff />
      ) : view === "syncing" ? (
        <RefreshCw className="spin" />
      ) : (
        <Check />
      )}
      <span>{label}</span>
    </div>
  );
}
