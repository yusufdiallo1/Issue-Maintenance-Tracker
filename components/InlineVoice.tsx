"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { useLang } from "@/app/providers";

/* eslint-disable @typescript-eslint/no-explicit-any */
type SR = any;

/**
 * Small inline mic for the description box. Where the browser supports the Web
 * Speech API (Chrome/Android) it streams partial text live into the field as
 * the user speaks; on stop it sends the final text to /api/voice for a Groq
 * polish. On Safari/iOS (no live API) it records and uses Groq Whisper instead.
 *
 * onInterim(text): live partial text (replaces the field while listening).
 * onFinal(text): the enhanced final text to commit.
 */
export function InlineVoice({
  lang,
  onInterim,
  onFinal,
  onError,
}: {
  lang: string;
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (kind: "denied" | "failed") => void;
}) {
  const { t } = useLang();
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const recogRef = useRef<SR | null>(null);
  const finalRef = useRef("");

  // MediaRecorder fallback refs (Safari/iOS).
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const hasLive =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    return () => {
      try {
        recogRef.current?.stop();
      } catch {
        /* ignore */
      }
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  async function enhance(text: string) {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (res.ok) {
        const { text: polished } = (await res.json()) as { text: string };
        onFinal((polished || text).trim());
      } else {
        onFinal(text.trim());
      }
    } catch {
      onFinal(text.trim());
    } finally {
      setBusy(false);
    }
  }

  function startLive() {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recog: SR = new Ctor();
    recog.lang =
      lang === "ar" ? "ar-SA" : lang === "ur" ? "ur-PK" : lang === "bn" ? "bn-BD" : "en-US";
    recog.continuous = true;
    recog.interimResults = true;
    finalRef.current = "";
    recog.onresult = (e: any) => {
      let interim = "";
      let final = finalRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i];
        if (tr.isFinal) final += tr[0].transcript;
        else interim += tr[0].transcript;
      }
      finalRef.current = final;
      onInterim((final + interim).trim());
    };
    recog.onerror = (e: any) => {
      setListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") onError("denied");
    };
    recog.onend = () => {
      setListening(false);
      void enhance(finalRef.current);
    };
    recogRef.current = recog;
    recog.start();
    setListening(true);
  }

  async function startRecord() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        streamRef.current?.getTracks().forEach((tr) => tr.stop());
        setListening(false);
        setBusy(true);
        try {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
          const fd = new FormData();
          fd.append("audio", blob, "recording.webm");
          const res = await fetch("/api/voice", { method: "POST", body: fd });
          const { text } = (await res.json()) as { text: string };
          if (text?.trim()) onFinal(text.trim());
          else onError("failed");
        } catch {
          onError("failed");
        } finally {
          setBusy(false);
        }
      };
      mediaRef.current = mr;
      mr.start(250);
      setListening(true);
    } catch {
      onError("denied");
    }
  }

  function toggle() {
    if (busy) return;
    if (listening) {
      if (hasLive) recogRef.current?.stop();
      else mediaRef.current?.stop();
      return;
    }
    if (hasLive) startLive();
    else void startRecord();
  }

  return (
    <button
      type="button"
      className={listening ? "ta-mic listening" : busy ? "ta-mic busy" : "ta-mic"}
      onClick={toggle}
      disabled={busy}
      aria-label={listening ? t("stop") : t("tapSpeak")}
      title={listening ? t("stop") : t("tapSpeak")}
    >
      {listening ? <Square /> : <Mic />}
    </button>
  );
}
