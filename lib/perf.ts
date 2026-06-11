"use client";

import { useEffect } from "react";

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
