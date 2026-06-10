"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns whether the entry animation (`.enter` class) should play for the
 * current `viewKey`.
 *
 * Hydration-safe: the initial render (SSR + first client render) always
 * returns `false`, so server and client markup match. After mount, the flag
 * flips to `true` whenever `viewKey` changes — so animations play on
 * screen-change / first-open but never on incidental re-renders, and never
 * cause a hydration mismatch. Mirrors the prototype's `.enter` gating.
 */
export function useViewEnter(viewKey: string): boolean {
  const [enter, setEnter] = useState(false);
  const mounted = useRef(false);
  const lastKey = useRef(viewKey);

  useEffect(() => {
    if (!mounted.current) {
      // First mount: play the entry animation once for the initial view.
      mounted.current = true;
      lastKey.current = viewKey;
      setEnter(true);
      return;
    }
    if (lastKey.current !== viewKey) {
      lastKey.current = viewKey;
      setEnter(true);
    }
  }, [viewKey]);

  return enter;
}
