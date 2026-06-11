"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { useLang } from "@/app/providers";

// Minimal Web Speech typings (not in lib.dom for all targets).
type SpeechRecognitionEventLike = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (e: SpeechRecognitionEventLike) => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
};

/**
 * Small inline mic for the description box. Records with MediaRecorder and
 * transcribes + enhances via Groq Whisper on /api/voice (works in every
 * browser, incl. Safari/iOS — far more reliable than the Web Speech API).
 * Tap to record (mic pulses), tap again to stop → ~2-3s → text fills the box.
 *
 * onInterim(text): shows a "listening…" placeholder while recording.
 * onFinal(text): the enhanced transcript to commit.
 */
export function InlineVoice({
  lang,
  onStart,
  onInterim,
  onFinal,
  onError,
}: {
  lang?: string;
  onStart?: () => void;
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (kind: "denied" | "failed") => void;
}) {
  const { t } = useLang();
  const [state, setState] = useState<"idle" | "recording" | "busy">("idle");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);
  // Optional live interim transcription (Web Speech API — Chrome/Android only).
  // Whisper (on stop) remains the authoritative final transcript.
  const recogRef = useRef<{ stop: () => void } | null>(null);

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

  // Live interim transcription via Web Speech (Chrome/Android). Best-effort —
  // emits interim text to onInterim while speaking. Silent no-op elsewhere.
  function startLiveCaption() {
    try {
      const w = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      };
      const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (!Ctor || !onInterim) return;
      const rec = new Ctor();
      rec.lang =
        lang === "en" ? "en-US" : lang === "ur" ? "ur-PK" : lang === "bn" ? "bn-BD" : "ar-SA";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e: SpeechRecognitionEventLike) => {
        let text = "";
        for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
        if (text.trim()) onInterim(text.trim());
      };
      rec.onerror = () => {};
      rec.start();
      recogRef.current = { stop: () => rec.stop() };
    } catch {
      /* ignore — Whisper still produces the final text */
    }
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
      startLiveCaption();
    } catch {
      onError("denied");
    }
  }

  function stop() {
    try {
      recogRef.current?.stop();
    } catch {
      /* ignore */
    }
    recogRef.current = null;
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
