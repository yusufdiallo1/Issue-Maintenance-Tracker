"use client";

import { useEffect, useState } from "react";
import { Bell, X, Share } from "lucide-react";
import { usePush } from "@/lib/usePush";
import { useLang } from "@/app/providers";
import { useToast } from "./Toast";
import { ModalPortal } from "./ModalPortal";

const DISMISS_KEY = "aurion_push_primer_dismissed";

/**
 * One-time, tasteful primer shown after login — BEFORE any cold permission
 * prompt. On iOS-in-Safari (not standalone) it explains "Install to Home
 * Screen" (Web Push needs the installed PWA there); elsewhere it offers Enable.
 */
export function PushPrimer() {
  const { state, subscribe, busy } = usePush();
  const { t } = useLang();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = setTimeout(() => {
      if (localStorage.getItem(DISMISS_KEY)) return;
      if (state === "unsupported" || state === "granted" || state === "denied") return;
      const ua = navigator.userAgent;
      const isIOS = /iPhone|iPad|iPod/i.test(ua);
      const standalone =
        window.matchMedia?.("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true;
      // iOS Web Push only works once installed to the Home Screen.
      if (isIOS && !standalone) {
        setIosNeedsInstall(true);
        setOpen(true);
      } else {
        setOpen(true);
      }
    }, 1200);
    return () => clearTimeout(id);
  }, [state]);

  if (!open) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  return (
    <ModalPortal>
      <div className="primer-scrim" onClick={dismiss}>
        <div className="primer" onClick={(e) => e.stopPropagation()}>
          <button className="primer-x" onClick={dismiss} aria-label={t("cancel")}>
            <X />
          </button>
          <div className="primer-ic">
            <Bell />
          </div>
          <div className="primer-title">{t("primerTitle")}</div>
          <div className="primer-body">
            {iosNeedsInstall ? t("primerInstall") : t("primerBody")}
          </div>
          {!iosNeedsInstall && (
            <button
              className="btn gold"
              disabled={busy}
              onClick={async () => {
                await subscribe();
                // After the prompt resolves, dismiss regardless (granted or not).
                localStorage.setItem(DISMISS_KEY, "1");
                setOpen(false);
                if (Notification.permission === "granted") show(t("pushOn"), "success");
              }}
            >
              <Bell />
              {t("primerEnable")}
            </button>
          )}
          {iosNeedsInstall && (
            <div className="primer-install">
              <Share />
              <span>{t("primerInstallStep")}</span>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
