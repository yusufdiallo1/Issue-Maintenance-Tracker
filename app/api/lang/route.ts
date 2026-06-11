// Persist the current user's preferred UI language to their profile so it
// follows them across devices. Best-effort; the cookie is the primary store.
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

const LANGS = ["ar", "en", "bn", "ur"];

export async function POST(request: Request) {
  const me = await getCurrentProfile();
  if (!me) return NextResponse.json({ ok: false }, { status: 401 });
  const { lang } = (await request.json().catch(() => ({}))) as { lang?: string };
  if (!lang || !LANGS.includes(lang)) return NextResponse.json({ ok: false }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("profiles").update({ preferred_language: lang }).eq("id", me.id);
  return NextResponse.json({ ok: true });
}
