"use client";

// ============================================================
// Client providers: language, theme, and a render-gating context
// for entry animations. The server seeds initial lang/theme from
// cookies (see layout.tsx) so first paint is already correct.
// ============================================================
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { t as rawT, tf as rawTf } from "@/lib/i18n/t";
import type { Key, Lang } from "@/lib/i18n/dictionary";
import { dirFor, LANG_COOKIE, THEME_COOKIE, writePrefCookie, type Theme } from "@/lib/prefs";
import { ToastProvider } from "@/components/Toast";
import { LoadingScreen } from "@/components/LoadingScreen";

// ---- Language ----
type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key) => string;
  tf: (key: Key, arg: number) => string;
  dir: "rtl" | "ltr";
};
const LangContext = createContext<LangCtx | null>(null);

export function useLang(): LangCtx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within <Providers>");
  return ctx;
}
/** Convenience hook bound to the current language. */
export function useT() {
  const { t, tf } = useLang();
  return { t, tf };
}

// ---- Theme ----
type ThemeCtx = { theme: Theme; setTheme: (th: Theme) => void };
const ThemeContext = createContext<ThemeCtx | null>(null);

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <Providers>");
  return ctx;
}

export function Providers({
  initialLang,
  initialTheme,
  children,
}: {
  initialLang: Lang;
  initialTheme: Theme;
  children: React.ReactNode;
}) {
  // `lang` is fixed for the session — changing it reloads the page (so SSR
  // re-renders everything + auto-translations in the new language).
  const [lang] = useState<Lang>(initialLang);
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [switching, setSwitching] = useState(false);

  const setLang = useCallback(
    (l: Lang) => {
      if (l === lang) return;
      writePrefCookie(LANG_COOKIE, l);
      // Persist to the profile (best-effort) so it follows the user across devices.
      void fetch("/api/lang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: l }),
      }).catch(() => {});
      // Show the loading screen, then hard-reload so every server component +
      // auto-translated description re-renders in the new language.
      setSwitching(true);
      const el = document.documentElement;
      el.lang = l;
      el.dir = dirFor(l);
      setTimeout(() => window.location.reload(), 450);
    },
    [lang],
  );

  const setTheme = useCallback((th: Theme) => {
    // Dark-only: remember the choice but always render dark.
    setThemeState(th);
    writePrefCookie(THEME_COOKIE, th);
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  const langValue = useMemo<LangCtx>(
    () => ({
      lang,
      setLang,
      dir: dirFor(lang),
      t: (key: Key) => rawT(key, lang),
      tf: (key: Key, arg: number) => rawTf(key, lang, arg),
    }),
    [lang, setLang],
  );

  const themeValue = useMemo<ThemeCtx>(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <LangContext.Provider value={langValue}>
      <ThemeContext.Provider value={themeValue}>
        <ToastProvider>{children}</ToastProvider>
        {switching && <LoadingScreen />}
      </ThemeContext.Provider>
    </LangContext.Provider>
  );
}
