// Connectivity smoke test: checks Supabase (service client) and Groq.
// Returns { supabase: boolean, groq: boolean }. No secrets in the response.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { groq } from "@/lib/groq/server";

export async function GET() {
  let supabase = false;
  let groqOk = false;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").select("*", { count: "exact", head: true });
    supabase = !error;
  } catch {
    supabase = false;
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 1,
      messages: [{ role: "user", content: "ping" }],
    });
    groqOk = !!completion.choices?.length;
  } catch {
    groqOk = false;
  }

  return NextResponse.json({ supabase, groq: groqOk }, { status: supabase && groqOk ? 200 : 503 });
}
