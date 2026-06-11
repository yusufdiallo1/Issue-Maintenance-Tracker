// Voice → polished text. Transcribes the recording (Groq Whisper), then has the
// LLM clean up ONLY the wording — fix grammar, add punctuation, keep the same
// language and meaning. It does NOT extract or choose any fields (the user
// picks property/room/type/urgency/tags manually). GROQ_API_KEY stays server-side.
import { NextResponse } from "next/server";
import { toFile } from "openai";
import { groq } from "@/lib/groq/server";
import { createClient } from "@/lib/supabase/server";

// Whisper transcription needs the Node.js runtime (not edge) for the file
// upload + the Groq SDK. The GROQ_API_KEY must be set in the server env.
export const runtime = "nodejs";

const POLISH_PROMPT = `You are a transcription editor for a hotel maintenance app. You receive a raw spoken note (Arabic, English, or a mix). Return a cleaned-up version of the SAME text: fix grammar and spelling, add correct punctuation and capitalization, and make it read as a clear one- or two-sentence problem description. Keep the SAME language the speaker used (do not translate).

Rules:
- Describe ONLY the problem(s). Do NOT invent facts, names, or details that were not said.
- The room and property are already recorded separately by the app, so NEVER add a room number and NEVER write any remark about the room number being missing, unspecified, or unknown (e.g. do not write "room 0" or "the room was not specified"). If no room was spoken, simply omit any mention of a room.
- Output ONLY the cleaned problem text — no quotes, labels, or commentary.`;

async function polish(transcript: string): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      messages: [
        { role: "system", content: POLISH_PROMPT },
        { role: "user", content: transcript },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() || transcript;
  } catch {
    return transcript;
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // JSON path: live Web Speech text → enhance wording only (no transcription).
  const ctype = request.headers.get("content-type") || "";
  if (ctype.includes("application/json")) {
    const { text } = (await request.json().catch(() => ({ text: "" }))) as { text?: string };
    const raw = (text ?? "").trim();
    if (!raw) return NextResponse.json({ transcript: "", text: "" });
    return NextResponse.json({ transcript: raw, text: await polish(raw) });
  }

  // Multipart path: record → Whisper transcribe → enhance (Safari/iOS fallback).
  const form = await request.formData();
  const blob = form.get("audio");
  if (!(blob instanceof Blob)) {
    return NextResponse.json({ error: "no_audio" }, { status: 400 });
  }
  if (blob.size < 2000) {
    return NextResponse.json({ transcript: "", text: "" });
  }

  // 1) Transcribe (auto-detect ar/en/mixed).
  let transcript = "";
  try {
    const ext = (blob.type.split("/")[1] || "webm").split(";")[0];
    const file = await toFile(blob, `recording.${ext}`, { type: blob.type || "audio/webm" });
    const result = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      response_format: "json",
      temperature: 0,
      prompt: "Hotel maintenance problem report.",
    });
    transcript = (result.text ?? "").trim();
  } catch (err) {
    console.error("voice transcribe error:", err);
    return NextResponse.json({ error: "transcription_failed" }, { status: 500 });
  }

  // Drop Whisper's classic silence hallucinations.
  const noise = ["thank you", "thank you.", "you", ".", "بسم الله"];
  if (!transcript || noise.includes(transcript.toLowerCase())) {
    return NextResponse.json({ transcript: "", text: "" });
  }

  // 2) Polish the wording only (never extract fields).
  return NextResponse.json({ transcript, text: await polish(transcript) });
}
