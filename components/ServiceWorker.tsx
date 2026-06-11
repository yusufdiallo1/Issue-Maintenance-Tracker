"use client";

import { useEffect } from "react";
import { useToast } from "./Toast";
import { useLang } from "@/app/providers";

/**
 * Registers the PWA service worker (precache + offline + push). When a new SW
 * version is found, shows a subtle "Update available — tap to refresh" toast;
 * tapping activates it and reloads once.
 */
export function ServiceWorker() {
  const { show } = useToast();
  const { t } = useLang();

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            // A new worker is installed AND there's an existing controller →
            // it's an update, not a first install.
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              show(t("updateAvailable"), "info");
              // Activate the waiting worker; controllerchange then reloads.
              reg.waiting?.postMessage("SKIP_WAITING");
            }
          });
        });
      } catch {
        /* ignore */
      }
    };

    if (document.readyState === "complete") void register();
    else window.addEventListener("load", () => void register(), { once: true });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, [show, t]);

  return null;
}
