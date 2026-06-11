"use client";

// Global sync status pill + outbox flusher. Watches connectivity; when online,
// replays queued ops in order (idempotent via client UUID) by calling the same
// server actions. On success Supabase realtime broadcasts the change to every
// device, so no manual refresh is needed.
import { useCallback, useEffect, useState } from "react";
import { CloudOff, RefreshCw, Check } from "lucide-react";
import { useOnline } from "@/lib/useOnline";
import { useLang } from "@/app/providers";
import { allOps, removeOp, bumpTries, pendingCount } from "@/lib/outbox";
import { takeIssue, markDone, reopenIssue, setDeadline, clearDeadline } from "@/app/actions/issues";

type Sync = "idle" | "syncing" | "synced";

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
    for (const op of ops) {
      try {
        const id = op.payload.issueId as number;
        if (op.kind === "take") await takeIssue(id);
        else if (op.kind === "done") await markDone(id);
        else if (op.kind === "reopen") await reopenIssue(id);
        else if (op.kind === "deadline") {
          const dl = op.payload.deadline as "today" | "tomorrow" | "days3" | "week" | null;
          if (dl) await setDeadline(id, dl);
          else await clearDeadline(id);
        }
        // (create-report ops are flushed by the Add screen which owns the photos.)
        if (op.kind !== "create") await removeOp(op.id);
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
