// Render an audit row as a bilingual sentence: "<actor> <verb> <target>".
import { propMeta, type Key, type Lang } from "@/lib/i18n/dictionary";
import type { AuditRow } from "@/lib/data";

const VERB_KEY: Record<string, Key> = {
  report: "vReport",
  take: "vTook",
  done: "vDone",
  deadline: "vDeadline",
  addemp: "vAdded",
  rmemp: "vRemoved",
  login: "vLogin",
};

export function auditText(
  e: AuditRow,
  lang: Lang,
  t: (key: Key) => string,
): { actor: string; verb: string; target: string } {
  const verb = t(VERB_KEY[e.action] ?? "vLogin");
  let target = "";
  if (e.target_property) {
    const pm = propMeta(e.target_property);
    target = `${pm ? pm[lang] : e.target_property} ${e.target_room ?? ""}`.trim();
  } else if (e.target_text) {
    target = e.target_text;
  }
  return { actor: e.actor_name, verb, target };
}
