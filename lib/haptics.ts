"use client";

/**
 * Tiny tactile tap (Android; no-op on iOS PWAs / unsupported — visual press
 * carries it there). Guarded + cheap; safe to call on any button press.
 */
export function tap(ms = 10): void {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}
