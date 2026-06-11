"use client";

import { useEffect, useState } from "react";

/** Reactive online/offline status (navigator.onLine + online/offline events). */
export function useOnline(): boolean {
  // Always start `true` to match the server's first render (avoids a hydration
  // mismatch); the effect corrects it on mount and on online/offline events.
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    // Defer the initial reconcile a tick so it isn't a synchronous
    // setState-in-effect (it also avoids the SSR hydration mismatch).
    const t0 = setTimeout(sync, 0);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      clearTimeout(t0);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  return online;
}
