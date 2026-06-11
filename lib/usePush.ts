"use client";

import { useCallback, useEffect, useState } from "react";
import { savePushSubscription, removePushSubscription } from "@/app/actions/push";

function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type PushState = "unsupported" | "default" | "granted" | "denied";

/** Manage the browser's push subscription (permission + subscribe/unsubscribe). */
export function usePush() {
  const [state, setState] = useState<PushState>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supported =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    // Defer a tick so this isn't a synchronous setState within the effect.
    const t0 = setTimeout(() => {
      if (!supported) {
        setState("unsupported");
        return;
      }
      setState(Notification.permission as PushState);
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setSubscribed(!!sub))
        .catch(() => {});
    }, 0);
    return () => clearTimeout(t0);
  }, []);

  const subscribe = useCallback(async () => {
    if (busy || state === "unsupported") return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setState(perm as PushState);
      if (perm !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      const json = sub.toJSON();
      await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });
      setSubscribed(true);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }, [busy, state]);

  const unsubscribe = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return { state, subscribed, busy, subscribe, unsubscribe };
}
