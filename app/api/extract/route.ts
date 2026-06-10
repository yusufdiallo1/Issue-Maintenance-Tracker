// Infer urgency from a problem description via Groq. The description itself is
// NEVER rewritten here (the spoken/typed text is authoritative) and we do NOT
// pick property/room/type — those are always chosen manually by the user.
import { NextResponse } from "next/server";
import { groq } from "@/lib/groq/server";
import { createClient } from "@/lib/supabase/server";
import { URG } from "@/lib/i18n/dictionary";

const URG_IDS: readonly string[] = URG.map((u) => u.id); // urgent, soon, wait

const SYSTEM_PROMPT = `You classify the urgency of a hotel maintenance problem from a short description (Arabic, English, or mixed).
Return ONLY a JSON object: {"urgency": string}.
"urgency" MUST be exactly one of: ${URG_IDS.join(", ")}.
Mapping: safety hazards / leaking / sparking / overflowing / guest-impacting => "urgent"; needs attention but not critical => "soon"; cosmetic or minor => "wait".
If you cannot tell, use "soon". Output JSON only.`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { transcript } = (await request.json()) as { transcript?: string };
  if (!transcript || !transcript.trim()) {
    return NextResponse.json({ result: { urgency: "" } });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: transcript.trim() },
      ],
    });
    const content = completion.choices[0]?.message?.content ?? "{}";
    let urgency = "";
    try {
      const parsed = JSON.parse(content) as { urgency?: string };
      if (URG_IDS.includes(parsed.urgency ?? "")) urgency = parsed.urgency as string;
    } catch {
      urgency = "";
    }
    return NextResponse.json({ result: { urgency } });
  } catch (err) {
    console.error("extract error:", err);
    return NextResponse.json({ result: { urgency: "" } });
  }
}
