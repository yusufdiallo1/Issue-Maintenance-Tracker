"use client";

import { useEffect, useState } from "react";
import { Bell, AlertTriangle, ShieldAlert } from "lucide-react";
import { useScrollLock } from "@/lib/useScrollLock";
import { ModalPortal } from "./ModalPortal";
import { useLang } from "@/app/providers";
import { usePush } from "@/lib/usePush";
import { useToast } from "./Toast";
import { createClient } from "@/lib/supabase/client";
import { ago } from "@/lib/issues";

type Notif = {
  id: number;
  kind: string;
  issue_id: number | null;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

/** Bell inbox: recent urgent/safety notifications + a push enable toggle. */
export function NotificationsModal({
  open,
  onClose,
  onOpenIssue,
}: {
  open: boolean;
  onClose: () => void;
  onOpenIssue: (issueId: number) => void;
}) {
  const { t, lang } = useLang();
  useScrollLock(open);
  const { subscribed, busy, subscribe, unsubscribe, state } = usePush();
  const { show } = useToast();
  const [supabase] = useState(() => createClient());
  const [items, setItems] = useState<Notif[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!active) return;
      setItems((data as Notif[]) ?? []);
      setLoaded(true);
      // Mark everything read on open.
      const unreadIds = ((data as Notif[]) ?? []).filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length) {
        await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, supabase]);

  if (!open) return null;

  const onToggle = async () => {
    if (state === "unsupported") {
      show(t("pushUnsupported"), "info");
      return;
    }
    if (subscribed) {
      await unsubscribe();
      show(t("pushOff"), "info");
    } else {
      await subscribe();
      show(t("pushOn"), "success");
    }
  };

  return (
    <ModalPortal>
      <div className="scrim modal-scrim enter" onClick={onClose} style={{ zIndex: 92 }}>
        <div
          className="modal enter"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="notif-head">
            <h2 style={{ margin: 0 }}>{t("notifications")}</h2>
            <button
              className={subscribed ? "btn gold" : "btn ghost"}
              style={{ width: "auto", padding: "8px 14px", fontSize: 13 }}
              onClick={onToggle}
              disabled={busy}
            >
              {subscribed ? t("pushOff") : t("pushOn")}
            </button>
          </div>

          {!loaded ? (
            <div className="empty">
              <Bell />
              <div>{t("loading")}</div>
            </div>
          ) : items.length === 0 ? (
            <div className="empty">
              <Bell />
              <div>{t("noNotifications")}</div>
            </div>
          ) : (
            <div className="notif-list">
              {items.map((n) => (
                <button
                  key={n.id}
                  className={n.read ? "notif-row" : "notif-row unread"}
                  onClick={() => {
                    if (n.issue_id) {
                      onOpenIssue(n.issue_id);
                      onClose();
                    }
                  }}
                >
                  <span className={`notif-ic ${n.kind}`}>
                    {n.kind === "safety" ? <ShieldAlert /> : <AlertTriangle />}
                  </span>
                  <span className="notif-body">
                    <span className="notif-title">{n.title}</span>
                    <span className="notif-text">{n.body}</span>
                    <span className="notif-time mono">{ago(n.created_at, lang)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
