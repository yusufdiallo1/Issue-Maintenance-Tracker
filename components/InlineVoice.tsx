"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { useLang } from "@/app/providers";

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
  onFinal,
  onError,
}: {
  lang?: string;
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (kind: "denied" | "failed") => void;
}) {
  const { t } = useLang();
  const [state, setState] = useState<"idle" | "recording" | "busy">("idle");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

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

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "";
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => void finish(mr.mimeType);
      mediaRef.current = mr;
      mr.start(250); // timeslice so audio always flushes even on a quick stop
      setState("recording");
    } catch {
      onError("denied");
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    if (mediaRef.current && mediaRef.current.state !== "inactive") mediaRef.current.stop();
  }

  async function finish(mimeType: string) {
    setState("busy");
    try {
      const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
      if (blob.size < 1200) {
        onError("failed");
        setState("idle");
        return;
      }
      const fd = new FormData();
      fd.append("audio", blob, "recording.webm");
      const res = await fetch("/api/voice", { method: "POST", body: fd });
      if (!res.ok) throw new Error("voice failed");
      const { text } = (await res.json()) as { text: string };
      if (text?.trim()) onFinal(text.trim());
      else onError("failed");
    } catch {
      onError("failed");
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
      {state === "busy" ? <Loader2 className="spin" /> : state === "recording" ? <Square /> : <Mic />}
    </button>
  );
}
