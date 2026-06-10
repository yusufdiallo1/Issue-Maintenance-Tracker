// ============================================================
// User preferences (language + theme), persisted in cookies so the
// server can render the correct <html lang dir data-theme> on the
// first paint — no flash of the wrong language/theme.
// ============================================================
import type { Lang } from "./i18n/dictionary";

export type Theme = "auto" | "light" | "dark";

export const LANG_COOKIE = "aurion_lang";
export const THEME_COOKIE = "aurion_theme";

export const DEFAULT_LANG: Lang = "ar"; // default is Arabic (RTL)
export const DEFAULT_THEME: Theme = "auto"; // follow system by default

// 1 year, in seconds.
export const PREF_MAX_AGE = 60 * 60 * 24 * 365;

export const dirFor = (lang: Lang): "rtl" | "ltr" => (lang === "ar" ? "rtl" : "ltr");

export const isLang = (v: unknown): v is Lang => v === "ar" || v === "en";
export const isTheme = (v: unknown): v is Theme => v === "auto" || v === "light" || v === "dark";

/** Parse raw cookie values into validated prefs, falling back to defaults. */
export function normalizePrefs(
  rawLang?: string,
  rawTheme?: string,
): {
  lang: Lang;
  theme: Theme;
} {
  return {
    lang: isLang(rawLang) ? rawLang : DEFAULT_LANG,
    theme: isTheme(rawTheme) ? rawTheme : DEFAULT_THEME,
  };
}

/** Client-side: write a preference cookie. */
export function writePrefCookie(name: string, value: string): void {
  document.cookie = `${name}=${value}; path=/; max-age=${PREF_MAX_AGE}; samesite=lax`;
}
