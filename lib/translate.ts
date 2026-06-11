import "server-only";

// Free-text translation, swappable behind one function so a paid engine
// (Google Cloud Translation / DeepL) can replace Groq for bn/ur later without
// touching callers. Uses Groq's largest free model. Server-only.
import { groq } from "@/lib/groq/server";
import type { Lang } from "@/lib/i18n/dictionary";

const LANG_NAME: Record<Lang, string> = {
  en: "English",
  ar: "Arabic",
  bn: "Bengali",
  ur: "Urdu",
};

/** Convert Eastern-Arabic + Bengali digits to Western 0-9. */
function toWesternDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹০-৯]/g, (d) => {
    const c = d.codePointAt(0)!;
    if (c >= 0x0660 && c <= 0x0669) return String(c - 0x0660); // Arabic-Indic
    if (c >= 0x06f0 && c <= 0x06f9) return String(c - 0x06f0); // Extended Arabic-Indic
    return String(c - 0x09e6); // Bengali
  });
}

/** Translate one hotel-maintenance note to `target`. Returns the input on failure. */
export async function translate(text: string, target: Lang): Promise<string> {
  const clean = text.trim();
  if (!clean) return "";
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `Translate this hotel maintenance note to ${LANG_NAME[target]}. Preserve room numbers, equipment names, and meaning exactly. ALWAYS write all numbers in Western numerals (0,1,2,3,4,5,6,7,8,9) — never Eastern-Arabic or Bengali digits. Return ONLY the translation — no quotes or commentary.`,
        },
        { role: "user", content: clean },
      ],
    });
    // Safety net: force Western digits regardless of what the model returned.
    return toWesternDigits(res.choices[0]?.message?.content?.trim() || clean);
  } catch {
    return clean;
  }
}

/**
 * Translate `text` (written in `source`) into the other three languages.
 * Returns a map keyed by lang, including the original under `source`.
 */
export async function translateAll(
  text: string,
  source: Lang,
): Promise<Partial<Record<Lang, string>>> {
  const targets: Lang[] = (["en", "ar", "bn", "ur"] as Lang[]).filter((l) => l !== source);
  const out: Partial<Record<Lang, string>> = { [source]: text.trim() };
  const results = await Promise.all(targets.map((l) => translate(text, l)));
  targets.forEach((l, i) => (out[l] = results[i]));
  return out;
}

/** Cheap heuristic source-language detection (script-based). */
export function detectLang(text: string): Lang {
  if (/[ঀ-৿]/.test(text)) return "bn"; // Bengali
  if (/[؀-ۿ]/.test(text)) {
    // Arabic script covers both ar and ur; Urdu-specific letters → ur.
    if (/[ٹڈںھہۃے]/.test(text)) return "ur";
    return "ar";
  }
  return "en";
}
