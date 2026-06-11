"use client";

// In-app "new issue" ping for when the app is OPEN (system push banners don't
// fire then). A short two-tone system-style chime via Web Audio (no asset) plus
// a vibration on Android. Honors prefers-reduced-motion for any visual pulse
// (the audio itself follows the caller's sound toggle).

function reducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/** Play a brief two-note chime + vibrate. `urgent` makes it a touch stronger. */
export async function pingNewIssue(urgent = false): Promise<void> {
  // Vibration (Android; guarded — iOS PWAs can't fire it, no-op there).
  try {
    if (navigator.vibrate) navigator.vibrate(urgent ? [300, 150, 300, 150, 300] : [200, 100, 200]);
  } catch {
    /* ignore */
  }
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const now = ctx.currentTime;
    const notes: [number, number][] = urgent
      ? [
          [880, now],
          [660, now + 0.14],
          [880, now + 0.28],
        ]
      : [
          [660, now],
          [880, now + 0.13],
        ];
    for (const [freq, at] of notes) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.13, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
      o.start(at);
      o.stop(at + 0.24);
    }
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    /* ignore — audio is best-effort */
  }
  void reducedMotion; // visual pulse is gated by callers; kept for parity
}
