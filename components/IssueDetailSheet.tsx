"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Clock, User, ArrowDownToLine, X } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import { useLang } from "@/app/providers";
import { propMeta } from "@/lib/i18n/dictionary";
import { createClient } from "@/lib/supabase/client";
import { useScrollLock } from "@/lib/useScrollLock";
import { useOnline } from "@/lib/useOnline";
import { useToast } from "./Toast";
import { enqueue, uuid, type OutboxKind } from "@/lib/outbox";
import {
  dueLabelKey,
  fmtDateTime,
  isOverdue,
  statusLabelKey,
  tagDisplay,
  typeLabelKey,
  urgencyColor,
  urgencyLabelKey,
  localizedDescription,
  type Deadline,
  type Issue,
} from "@/lib/issues";
import { LANGS } from "@/lib/i18n/dictionary";
import { takeIssue, markDone, reopenIssue, setDeadline, clearDeadline } from "@/app/actions/issues";

const DEADLINE_OPTS: { id: Deadline; key: "ddToday" | "ddTomorrow" | "ddDays3" | "ddWeek" }[] = [
  { id: "today", key: "ddToday" },
  { id: "tomorrow", key: "ddTomorrow" },
  { id: "days3", key: "ddDays3" },
  { id: "week", key: "ddWeek" },
];

export function IssueDetailSheet({
  issue,
  reporterName,
  takerName,
  currentUserId,
  isAdmin,
  open,
  enter,
  onClose,
}: {
  issue: Issue | null;
  reporterName: string;
  takerName: string | null;
  currentUserId: string;
  isAdmin: boolean;
  open: boolean;
  enter: boolean;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  useScrollLock(open);
  const online = useOnline();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [supabase] = useState(() => createClient());
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  // Resolve signed URLs for the issue's stored photo paths.
  const pathsKey = (issue?.photo_paths ?? []).join(",");
  useEffect(() => {
    let active = true;
    const list = pathsKey ? pathsKey.split(",") : [];
    Promise.all(
      list.map((p) =>
        supabase.storage
          .from("issue-photos")
          .createSignedUrl(p, 3600)
          .then(({ data }) => data?.signedUrl ?? null),
      ),
    ).then((urls) => {
      if (active) setPhotoUrls(urls.filter((u): u is string => !!u));
    });
    return () => {
      active = false;
    };
  }, [pathsKey, supabase]);

  if (!issue || !open) return null;

  const pm = propMeta(issue.property);
  const overdue = isOverdue(issue);
  const mine = issue.taken_by === currentUserId;
  const loc = localizedDescription(issue, lang);
  const desc = showOriginal ? loc.original : loc.text;

  // Run a lifecycle mutation: toast on success, queue to the outbox on
  // offline/failure (so it syncs when back online — realtime then broadcasts
  // the change to every device). Closing the sheet gives instant feedback.
  const run = (
    kind: OutboxKind,
    fn: () => Promise<{ ok?: boolean } | unknown>,
    extra: Record<string, unknown> = {},
  ) => {
    const payload = { issueId: issue.id, ...extra };
    if (!online) {
      void enqueue({ id: uuid(), kind, payload });
      show(t("queuedOffline"), "info");
      onClose();
      return;
    }
    startTransition(async () => {
      try {
        await fn();
        show(t("saved"), "success");
      } catch {
        await enqueue({ id: uuid(), kind, payload });
        show(t("queuedOffline"), "info");
      }
    });
  };

  // Action button per state (matches the prototype rules).
  let action: React.ReactNode = null;
  if (issue.status === "done") {
    if (mine || isAdmin) {
      action = (
        <div className="actionrow one">
          <button
            className="abtn reopen"
            disabled={pending}
            onClick={() => run("reopen", () => reopenIssue(issue.id))}
          >
            <ArrowDownToLine />
            {t("reopen")}
          </button>
        </div>
      );
    }
  } else if (!issue.taken_by) {
    action = (
      <div className="actionrow one">
        <button
          className="abtn take"
          disabled={pending}
          onClick={() => run("take", () => takeIssue(issue.id))}
        >
          <ArrowDownToLine />
          {t("take")}
        </button>
      </div>
    );
  } else if (mine) {
    action = (
      <div className="actionrow one">
        <button
          className="abtn done"
          disabled={pending}
          onClick={() => run("done", () => markDone(issue.id))}
        >
          <Check />
          {t("markDone")}
        </button>
      </div>
    );
  } else {
    // Claimed by someone else: show a disabled "Taken" indicator, never
    // "Mark as done" (only the owner can complete it).
    action = (
      <div className="actionrow one">
        <button className="abtn taken" disabled>
          <User />
          {t("takenBy")} {takerName ?? ""}
        </button>
      </div>
    );
  }

  return (
    <div
      className={enter ? "scrim modal-scrim enter" : "scrim modal-scrim"}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className={enter ? "modal enter" : "modal"} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ marginBottom: 14 }}>
          <div className="thumb" style={{ width: 50, height: 50, background: `var(--card2)` }}>
            <CategoryIcon type={issue.type} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>
              {pm ? pm[lang] : issue.property}
              {issue.room ? ` · ${issue.room}` : ""}
            </div>
            <div style={{ color: "var(--dim)", fontSize: 13, fontWeight: 600 }}>
              {t(typeLabelKey(issue.type))} · {t(statusLabelKey(issue.status))}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <span
            className="ubadge"
            style={{
              color: urgencyColor(issue.urgency),
              background: `color-mix(in srgb, ${urgencyColor(issue.urgency)} 16%, transparent)`,
              fontSize: 13,
              padding: "5px 12px",
            }}
          >
            {t(urgencyLabelKey(issue.urgency))}
          </span>
        </div>

        {/* Photos: stored images at natural aspect, else the clean placeholder. */}
        {photoUrls.length > 0 ? (
          <div className="photo-gallery" style={{ marginBottom: 16 }}>
            {photoUrls.map((url, i) => (
              <button
                key={i}
                className="photo-cell clickable"
                onClick={() => setLightbox(url)}
                aria-label="View photo"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" />
              </button>
            ))}
          </div>
        ) : (
          <div className="photo-empty">
            <CategoryIcon type={issue.type} />
            <span className="pe-cap">{t("noPhoto")}</span>
          </div>
        )}

        <p style={{ fontSize: 16, lineHeight: 1.55, marginBottom: loc.translated ? 4 : 12 }}>
          {desc}
        </p>
        {loc.translated && (
          <button
            className="translated-note"
            onClick={() => setShowOriginal((v) => !v)}
            type="button"
          >
            {showOriginal
              ? t("showTranslation")
              : `${t("translatedFrom")} ${LANGS.find((l) => l.id === loc.source)?.label ?? loc.source}`}
          </button>
        )}

        {(issue.deadline || (issue.tags ?? []).length > 0) && (
          <div className="l3" style={{ marginBottom: 14 }}>
            {issue.deadline && (
              <span className={overdue ? "due over" : "due"}>
                <Clock />
                {overdue ? t("overdue") : t(dueLabelKey(issue.deadline))}
              </span>
            )}
            {(issue.tags ?? []).map((tag) => {
              const label = tagDisplay(tag, t, {
                tagTranslations: issue.tag_translations,
                lang,
              });
              return label ? (
                <span key={tag} className="tagmini">
                  {label}
                </span>
              ) : null;
            })}
          </div>
        )}

        {issue.taken_by && (
          <div className={mine ? "takenline you" : "takenline"}>
            <User />
            {mine ? t("youTook") : `${t("takenBy")} ${takerName ?? ""}`}
          </div>
        )}

        <div style={{ fontSize: 13, color: "var(--faint)", fontWeight: 500, marginBottom: 16 }}>
          {t("reportedBy")} {reporterName} · {fmtDateTime(issue.created_at, lang)}
        </div>

        {action}

        {/* Admin-only deadline controls. */}
        {isAdmin && (
          <>
            <div className="section-h" style={{ margin: "18px 0 10px" }}>
              {t("deadline")}
            </div>
            <div className="ddchips">
              {DEADLINE_OPTS.map((o) => (
                <button
                  key={o.id}
                  className={issue.deadline === o.id ? "ddchip on" : "ddchip"}
                  disabled={pending}
                  onClick={() =>
                    run("deadline", () => setDeadline(issue.id, o.id), { deadline: o.id })
                  }
                >
                  {t(o.key)}
                </button>
              ))}
              {issue.deadline && (
                <button
                  className="ddchip clear"
                  disabled={pending}
                  onClick={() => run("deadline", () => clearDeadline(issue.id), { deadline: null })}
                >
                  {t("clearDl")}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="x" onClick={() => setLightbox(null)} aria-label="Close">
            <X />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
