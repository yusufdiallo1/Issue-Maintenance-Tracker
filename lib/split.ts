import "server-only";

// Split a free-text maintenance note that may describe SEVERAL distinct problems
// into one entry per problem, each with its own category + urgency. One spoken
// report ("internet slow, TV lagging, furniture scratched") → 3 tracked issues.
// Server-only (Groq). Falls back to a single problem on any failure.
import { groq } from "@/lib/groq/server";

export type SplitProblem = {
  description: string;
  type: string;
  urgency: "urgent" | "soon" | "wait";
};

const TYPES = [
  "ac",
  "plumbing",
  "electrical",
  "furniture",
  "appliances",
  "internet",
  "cleaning",
  "safety",
  "other",
];

const SPLIT_PROMPT = `You are a triage assistant for a hotel maintenance app. You receive ONE free-text note (English, Arabic, Bengali, Urdu, or a mix) that may describe one OR several separate problems.

Split it into distinct problems — one object per genuinely separate issue. If it is really just one problem, return one object.

For each problem return:
- "description": a clear one-sentence description of THAT problem, in the SAME language as the input. Do not invent details. Never mention room numbers or that a room is "unspecified" (rooms are tracked separately).
- "type": one of ${TYPES.join(", ")} (best match; use "other" if unsure).
- "urgency": one of urgent, soon, wait (safety/flooding/electrical hazards = urgent; cosmetic = wait; default soon).

Return ONLY a json object: {"problems":[{"description":"...","type":"...","urgency":"..."}]}. No prose.`;

export async function splitProblems(
  text: string,
  fallbackType: string,
  fallbackUrgency: "urgent" | "soon" | "wait",
): Promise<SplitProblem[]> {
  const clean = text.trim();
  const fallback: SplitProblem[] = [
    { description: clean, type: fallbackType, urgency: fallbackUrgency },
  ];
  if (!clean) return fallback;
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SPLIT_PROMPT },
        { role: "user", content: clean },
      ],
    });
    const raw = res.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { problems?: SplitProblem[] };
    const problems = (parsed.problems ?? [])
      .filter((p) => p && typeof p.description === "string" && p.description.trim())
      .map((p) => ({
        description: p.description.trim(),
        type: TYPES.includes(p.type) ? p.type : fallbackType,
        urgency: (["urgent", "soon", "wait"] as const).includes(p.urgency)
          ? p.urgency
          : fallbackUrgency,
      }));
    return problems.length ? problems : fallback;
  } catch {
    return fallback;
  }
}
