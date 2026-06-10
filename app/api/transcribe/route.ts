// Server-side audio transcription via Groq Whisper.
// Accepts an audio blob (multipart form field "audio"), returns { text }.
// GROQ_API_KEY never leaves the server. Auth required.
import { NextResponse } from "next/server";
import { toFile } from "openai";
import { groq } from "@/lib/groq/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const form = await request.formData();
  const blob = form.get("audio");
  if (!(blob instanceof Blob)) {
    return NextResponse.json({ error: "no_audio" }, { status: 400 });
  }
  // Guard against empty/near-silent recordings — Whisper can hallucinate text
  // from silence, so we require a minimum amount of audio data.
  if (blob.size < 2000) {
    return NextResponse.json({ text: "" });
  }

  try {
    const ext = (blob.type.split("/")[1] || "webm").split(";")[0];
    const file = await toFile(blob, `recording.${ext}`, {
      type: blob.type || "audio/webm",
    });
    const result = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      // Auto-detect language (Arabic, English, mixed). temperature 0 + a
      // neutral prompt reduce hallucination on short clips.
      response_format: "json",
      temperature: 0,
      prompt: "Hotel maintenance problem report.",
    });
    const text = (result.text ?? "").trim();
    // Whisper's classic silence hallucinations — drop them.
    const noise = ["thank you", "thank you.", "you", ".", "بسم الله"];
    if (noise.includes(text.toLowerCase())) {
      return NextResponse.json({ text: "" });
    }
    return NextResponse.json({ text });
  } catch (err) {
    console.error("transcribe error:", err);
    return NextResponse.json({ error: "transcription_failed" }, { status: 500 });
  }
}
