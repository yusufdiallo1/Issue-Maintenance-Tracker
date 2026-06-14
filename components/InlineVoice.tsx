"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { useLang } from "@/app/providers";

/**
 * Small inline mic for the description box. Records with MediaRecorder and
 * transcribes via Groq Whisper on /api/voice — the ONLY transcription engine.
 * (The browser Web Speech API was removed: it hallucinated wrong text, e.g.
 * turned Arabic "المكيف لا يعمل" into English nonsense. Whisper is accurate
 * across Arabic/English/mixed, so it is the single source of truth — we never
 * show interim/guessed text that could be wrong.)
 * Tap to record (mic pulses + red outline), tap again to stop → Whisper fills
 * the box with the final, correct transcript.
 *
 * onStart(): recording began (parent shows the red outline).
 * onFinal(text): the Whisper transcript to commit (only ever correct text).
 */
export function InlineVoice({
  lang,
  onStart,
  onFinal,
  onError,
}: {
  lang?: string;
  onStart?: () => void;
  onFinal: (text: string) => void;
  onError: (kind: "denied" | "failed") => void;
}) {
  const { t } = useLang();
  const [state, setState] = useState<"idle" | "recording" | "busy">("idle");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    return () => {
      try {
        if (mediaRef.current && mediaRef.current.state !== "inactive") mediaRef.current.stop();
      } catch {
        /* ignore */
      }
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  // Pick a mimeType the browser actually supports. iOS Safari often ONLY
  // supports audio/mp4 — try it first there so transcription never silently
  // fails on iPhone; otherwise prefer opus.
  function pickMime(): string {
    const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const order = isIOS
      ? ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"]
      : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
    for (const m of order) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
    }
    return "";
  }

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      // eslint-disable-next-line react-hooks/purity -- event handler, not render
      startedAtRef.current = Date.now();
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => void finish(mr.mimeType);
      mediaRef.current = mr;
      mr.start(250); // timeslice so audio always flushes even on a quick stop
      setState("recording");
      onStart?.();
    } catch {
      onError("denied");
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    if (mediaRef.current && mediaRef.current.state !== "inactive") mediaRef.current.stop();
  }

  // POST the blob with a 15s timeout; one automatic retry on transient failure.
  async function postVoice(blob: Blob, ext: string): Promise<string | null> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      try {
        const fd = new FormData();
        fd.append("audio", blob, `recording.${ext}`);
        if (lang) fd.append("lang", lang); // hint Whisper toward the UI language
        const res = await fetch("/api/voice", { method: "POST", body: fd, signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`voice ${res.status}`);
        const { text } = (await res.json()) as { text: string };
        return text?.trim() ? text.trim() : "";
      } catch {
        clearTimeout(timer);
        if (attempt === 1) return null; // both attempts failed
        await new Promise((r) => setTimeout(r, 600)); // brief backoff, then retry
      }
    }
    return null;
  }

  async function finish(mimeType: string) {
    setState("busy");
    try {
      // Too short / silence → gentle retry, never POST an empty blob.
      const elapsed = Date.now() - (startedAtRef.current || 0);
      const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
      if (elapsed < 500 || blob.size < 1500) {
        onError("failed");
        return;
      }
      const ext = (mimeType || "audio/webm").includes("mp4")
        ? "mp4"
        : (mimeType || "").includes("ogg")
          ? "ogg"
          : "webm";
      const text = await postVoice(blob, ext);
      if (text === null) onError("failed");
      else if (text) onFinal(text);
      else onError("failed"); // empty transcript (silence)
    } finally {
      setState("idle");
    }
  }

  function toggle() {
    if (state === "busy") return;
    if (state === "recording") stop();
    else void start();
  }

  return (
    <button
      type="button"
      className={
        state === "recording" ? "ta-mic listening" : state === "busy" ? "ta-mic busy" : "ta-mic"
      }
      onClick={toggle}
      disabled={state === "busy"}
      aria-label={state === "recording" ? t("stop") : t("tapSpeak")}
      title={state === "recording" ? t("stop") : t("tapSpeak")}
    >
      {state === "busy" ? (
        <Loader2 className="spin" />
      ) : state === "recording" ? (
        <Square />
      ) : (
        <Mic />
      )}
    </button>
  );
}
