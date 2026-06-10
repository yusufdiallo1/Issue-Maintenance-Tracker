// ============================================================
// Pure translation helpers — safe in both server and client code.
// Western numerals everywhere (we never localize digits).
// ============================================================
import { T, type Key, type Lang } from "./dictionary";

/** Translate a static key for a language. */
export function t(key: Key, lang: Lang): string {
  const entry = T[key];
  if (!entry) return key;
  const v = entry[lang];
  // `ago` is the only formatter entry; t() returns its identity fallback.
  return typeof v === "function" ? key : v;
}

/** Translate a formatter key (e.g. `ago`) with an argument. */
export function tf(key: Key, lang: Lang, arg: number): string {
  const v = T[key][lang];
  return typeof v === "function" ? v(arg) : v;
}

export type { Key, Lang };
