"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { useLang } from "@/app/providers";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "./Toast";
import { ConfirmDialog } from "./ConfirmDialog";
import { propMeta } from "@/lib/i18n/dictionary";
import { localizedDescription, type Issue } from "@/lib/issues";
import { approveCompletion, rejectCompletion } from "@/app/actions/issues";

/** Admin-only: review pending completions (proof + note + AI hint) and approve/reject. */
export function PendingScreen({ issues }: { issues: Issue[] }) {
  const { t, lang } = useLang();
  const { show } = useToast();
  const [supabase] = useState(() => createClient());
  const [pending, startTransition] = useTransition();
  const [proofUrls, setProofUrls] = useState<Record<number, string[]>>({});
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const list = useMemo(
    () =>
      issues
        .filter((i) => i.status === "pending")
        .sort((a, b) => new Date(b.done_at ?? 0).getTime() - new Date(a.done_at ?? 0).getTime()),
    [issues],
  );

  const proofKey = list.map((i) => `${i.id}:${(i.proof_paths ?? []).join("|")}`).join(",");
  useEffect(() => {
    let active = true;
    Promise.all(
      list.map(async (i) => {
        const paths = i.proof_paths ?? [];
        const urls = await Promise.all(
          paths.map((p) =>
            supabase.storage
              .from("issue-photos")
              .createSignedUrl(p, 3600, { transform: { width: 480, height: 480, resize: "cover" } })
              .then(({ data }) => data?.signedUrl ?? ""),
          ),
        );
        return [i.id, urls.filter(Boolean)] as const;
      }),
    ).then((pairs) => {
      if (!active) return;
      const map: Record<number, string[]> = {};
      pairs.forEach(([id, urls]) => (map[id] = urls));
      setProofUrls(map);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proofKey, supabase]);

  const onApprove = (id: number) =>
    startTransition(async () => {
      const res = await approveCompletion(id);
      show(res.ok ? t("approved") : t("loadError"), res.ok ? "success" : "error");
    });

  const onReject = () => {
    const id = rejecting;
    if (id == null) return;
    const r = reason.trim();
    setRejecting(null);
    setReason("");
    startTransition(async () => {
      const res = await rejectCompletion(id, r);
      show(res.ok ? t("rejected") : t("loadError"), res.ok ? "info" : "error");
    });
  };

  return (
    <div className="screen">
      <h1 className="title">{t("pendingTitle")}</h1>
      {list.length === 0 ? (
        <div className="empty">{t("pendingEmpty")}</div>
      ) : (
        <div className="pending-list">
          {list.map((i) => {
            const pm = propMeta(i.property);
            const loc = localizedDescription(i, lang);
            const note = i.proof_note || "";
            return (
              <div key={i.id} className="card glass pending-card">
                <div className="pc-head">
                  <div className="pc-where">
                    {i.room || (pm ? pm[lang] : "")}
                    {i.room && pm ? ` · ${pm[lang]}` : ""}
                  </div>
                  <div className="pc-prob">{loc.text}</div>
                </div>

                {(proofUrls[i.id] ?? []).length > 0 && (
                  <>
                    <div className="section-h">{t("proofLabel")}</div>
                    <div className="photo-gallery">
                      {(proofUrls[i.id] ?? []).map((url, k) => (
                        <div key={k} className="photo-cell">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" loading="lazy" decoding="async" />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {note && <p className="pc-note">“{note}”</p>}

                <div className="pc-hint">
                  <Sparkles />
                  <span>
                    <b>{t("aiHint")}:</b> {aiHint(i, note)}
                  </span>
                </div>

                <div className="pc-actions">
                  <button
                    className="btn ghost"
                    disabled={pending}
                    onClick={() => {
                      setRejecting(i.id);
                      setReason("");
                    }}
                  >
                    <X />
                    {t("reject")}
                  </button>
                  <button className="btn gold" disabled={pending} onClick={() => onApprove(i.id)}>
                    <Check />
                    {t("approve")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={rejecting != null}
        title={t("reject")}
        message={t("rejectReason")}
        confirmLabel={t("reject")}
        danger
        onCancel={() => setRejecting(null)}
        onConfirm={onReject}
      />
    </div>
  );
}

// Lightweight, deterministic advisory (no extra LLM round-trip on the client).
// The admin decides; this just nudges attention.
function aiHint(issue: Issue, note: string): string {
  const photos = (issue.proof_paths ?? []).length;
  if (!photos) return "No proof photos attached — ask for evidence.";
  if (!note.trim()) return `${photos} proof photo(s) attached, but no description of the fix.`;
  return `${photos} proof photo(s) + a note describing the fix — looks complete; verify the photos match the problem.`;
}
