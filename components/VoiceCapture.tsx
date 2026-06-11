"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { useLang } from "@/app/providers";

type Phase = "idle" | "listening" | "understanding";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/** Two-note success chime via Web Audio (no asset). Honors the mute flag. */
function playChime(muted: boolean) {
  if (muted || prefersReducedMotion()) return;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const now = ctx.currentTime;
    [
      [660, now],
      [880, now + 0.12],
    ].forEach(([freq, at]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.12, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
      o.start(at);
      o.stop(at + 0.24);
    });
    setTimeout(() => ctx.close(), 600);
  } catch {
    /* ignore */
  }
}

/**
 * Cinematic voice capture: big mic → live gold waveform (Web Audio
 * AnalyserNode) → POST to /api/voice (Whisper transcribe + LLM polish) →
 * returns the polished text (description only). One focal element, generous
 * space. Reduced-motion disables the waveform/chime/haptics. Fully a11y.
 */
export function VoiceCapture({
  onResult,
  onError,
}: {
  onResult: (polished: string, transcript: string) => void;
  onError: (kind: "denied" | "failed" | "timeout") => void;
}) {
  const { t } = useLang();
  const [phase, setPhase] = useState<Phase>("idle");
  // Mute flag for the success chime (a toggle can be surfaced later).
  const muted = false;

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
  useEffect(() => cleanup, []);

  function drawWaveform() {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const buf = new Uint8Array(analyser.fftSize);

    const gold = getComputedStyle(document.documentElement).getPropertyValue("--fill") || "#c6a253";
    const render = () => {
      analyser.getByteTimeDomainData(buf);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = gold.trim();
      ctx.shadowBlur = 12;
      ctx.shadowColor = gold.trim();
      ctx.beginPath();
      const slice = w / buf.length;
      for (let i = 0; i < buf.length; i++) {
        const v = buf[i] / 128 - 1; // -1..1
        const y = h / 2 + v * (h / 2) * 0.9;
        const x = i * slice;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      rafRef.current = requestAnimationFrame(render);
    };
    render();
  }

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Waveform pipeline (skip under reduced motion — fields just appear).
      if (!prefersReducedMotion()) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AC();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        analyserRef.current = analyser;
      }

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
      mr.onstop = () => void finish();
      mediaRef.current = mr;
      mr.start(250);
      setPhase("listening");
      requestAnimationFrame(drawWaveform);
    } catch {
      cleanup();
      setPhase("idle");
      onError("denied");
    }
  }

  function stop() {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
  }

  async function finish() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    setPhase("understanding");
    const blob = new Blob(chunksRef.current, { type: mediaRef.current?.mimeType || "audio/webm" });
    try {
      const fd = new FormData();
      fd.append("audio", blob, "recording.webm");
      const ctrl = new AbortController();
      timeoutRef.current = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch("/api/voice", { method: "POST", body: fd, signal: ctrl.signal });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (!res.ok) throw new Error("voice failed");
      const { text, transcript } = (await res.json()) as { text: string; transcript: string };
      if (!text?.trim()) {
        onError("failed");
      } else {
        if (navigator.vibrate && !prefersReducedMotion()) navigator.vibrate(12);
        playChime(muted);
        onResult(text.trim(), transcript ?? "");
      }
    } catch (e) {
      onError((e as Error).name === "AbortError" ? "timeout" : "failed");
    } finally {
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
      setPhase("idle");
    }
  }

  const hint =
    phase === "listening" ? t("listening") : phase === "understanding" ? t("understanding") : null;

  return (
    <div className="voicecap" aria-live="polite">
      <button
        className={phase === "listening" ? "mic rec" : "mic"}
        onClick={phase === "listening" ? stop : phase === "idle" ? start : undefined}
        disabled={phase === "understanding"}
        aria-label={phase === "listening" ? t("stop") : t("tapSpeak")}
      >
        {phase === "listening" ? <Square /> : <Mic />}
      </button>

      {phase === "listening" && <canvas ref={canvasRef} className="waveform" aria-hidden />}

      <div className="michint">
        {hint ? (
          hint
        ) : (
          <>
            <b>{t("tapSpeak").split(" ")[0]}</b> {t("tapSpeak").split(" ").slice(1).join(" ")}
          </>
        )}
      </div>
    </div>
  );
}
