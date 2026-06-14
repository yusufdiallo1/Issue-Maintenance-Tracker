"use client";

import { useEffect } from "react";

/**
 * Tags <html> with the current display mode so the nav (and anything else) can
 * adapt to where the app is running:
 *   - `standalone`  → installed / full-screen PWA (no browser chrome): nav sits
 *     flush at the very bottom.
 *   - `in-browser`  → a normal browser tab (URL bar, gesture area, bottom bar):
 *     nav floats up a little so it clears the browser chrome.
 * Re-evaluates live (e.g. if the user installs, or the standalone media query
 * flips). iOS Safari is covered via `navigator.standalone`.
 */
export function useDisplayMode() {
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia?.("(display-mode: standalone)");
    const apply = () => {
      const standalone =
        !!mq?.matches ||
        (window.navigator as { standalone?: boolean }).standalone === true ||
        document.referrer.startsWith("android-app://");
      root.classList.toggle("standalone", standalone);
      root.classList.toggle("in-browser", !standalone);
    };
    const id = setTimeout(apply, 0);
    mq?.addEventListener?.("change", apply);
    return () => {
      clearTimeout(id);
      mq?.removeEventListener?.("change", apply);
    };
  }, []);
}

/**
 * Adds `html.low-power` on weak devices (few cores / little RAM) so the CSS can
 * drop the expensive `url(#liquidGlass)` refraction on the nav/sidebar/sheets
 * and fall back to plain frost — keeping glass at ~60fps on cheap Android.
 */
export function useLowPowerClass() {
  useEffect(() => {
    const id = setTimeout(() => {
      const nav = navigator as Navigator & { deviceMemory?: number };
      const lowMem = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
      const fewCores =
        typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
      if (lowMem || fewCores) document.documentElement.classList.add("low-power");
    }, 0);
    return () => clearTimeout(id);
  }, []);
}
