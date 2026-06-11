"use server";

// Admin AI workload recap. Computes the stats server-side, then asks Groq for a
// one-paragraph natural-language summary in the requested language. Cached
// briefly (per-language) to avoid hammering the model on every visit.
import { groq } from "@/lib/groq/server";
import { getCurrentProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { TYPES, type Lang } from "@/lib/i18n/dictionary";
import { isOverdue, minutesAgo, type Issue } from "@/lib/issues";

type CacheEntry = { text: string; at: number };
const cache: Partial<Record<Lang, CacheEntry>> = {};
const TTL = 60_000; // 1 minute

const typeLabelEn = (id: string) => {
  const k = TYPES.find((x) => x.id === id)?.k;
  // Minimal EN labels for the model prompt (avoids importing the full dict map).
  const map: Record<string, string> = {
    tAC: "AC",
    tPlumb: "plumbing",
    tElec: "electrical",
    tFurn: "furniture",
    tAppl: "appliances",
    tNet: "internet/TV",
    tClean: "cleaning",
    tSafe: "safety",
    tOther: "other",
  };
  return k ? (map[k] ?? id) : id;
};

export async function getAiSummary(lang: Lang): Promise<{ text: string }> {
  const me = await getCurrentProfile();
  if (!me || me.role !== "admin") return { text: "" };

  const hit = cache[lang];
  if (hit && Date.now() - hit.at < TTL) return { text: hit.text };

  const supabase = await createClient();
  const { data } = await supabase.from("issues").select("*");
  const issues = (data ?? []) as Issue[];

  const open = issues.filter((i) => i.status !== "done");
  const urgent = open.filter((i) => i.urgency === "urgent");
  const overdue = open.filter((i) => isOverdue(i));
  const counts: Record<string, number> = {};
  open.forEach((i) => (counts[i.type] = (counts[i.type] ?? 0) + 1));
  const topTypes = Object.keys(counts)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, 2)
    .map(typeLabelEn);
  const oldest = open
    .slice()
    .sort((a, b) => minutesAgo(b.created_at) - minutesAgo(a.created_at))[0];
  const oldestH = oldest ? Math.floor(minutesAgo(oldest.created_at) / 60) : 0;

  if (!open.length) {
    const text =
      lang === "ar"
        ? "لا توجد بلاغات مفتوحة — كل شيء تحت السيطرة."
        : "No open issues — everything's under control.";
    cache[lang] = { text, at: Date.now() };
    return { text };
  }

  const facts = `open=${open.length}, urgent=${urgent.length}, overdue=${overdue.length}, topTypes=${topTypes.join(",")}, oldestOpenHours=${oldestH}`;

  let text = "";
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are a hotel maintenance supervisor assistant. Write ONE short paragraph (2-3 sentences) summarizing the open workload in ${{ ar: "Arabic", en: "English", bn: "Bengali", ur: "Urdu" }[lang]}. Be specific and actionable. Use Western numerals. Output only the paragraph.`,
        },
        { role: "user", content: `Stats: ${facts}` },
      ],
    });
    text = completion.choices[0]?.message?.content?.trim() ?? "";
  } catch {
    // Fallback to a deterministic recap if the model is unavailable.
    text =
      lang === "ar"
        ? `${open.length} بلاغات مفتوحة، منها ${urgent.length} عاجلة. ${overdue.length} تجاوزت الموعد النهائي.`
        : `${open.length} open issues, ${urgent.length} urgent. ${overdue.length} past deadline.`;
  }

  cache[lang] = { text, at: Date.now() };
  return { text };
}
