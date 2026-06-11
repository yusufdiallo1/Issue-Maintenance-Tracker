import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Noto_Sans_Bengali, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { LiquidGlassFilter } from "@/components/LiquidGlassFilter";
import { ServiceWorker } from "@/components/ServiceWorker";
import { dirFor, LANG_COOKIE, normalizePrefs, THEME_COOKIE } from "@/lib/prefs";

// Resend-style precision: Geist for UI, Geist Mono for IDs / rooms / timestamps
// / audit. Exposed as CSS vars; Arabic falls back to the system Arabic stack.
const geist = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
// Bengali + Urdu (Naskh) scripts — applied via [lang] in CSS.
const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bn",
  display: "swap",
});
const notoUrdu = Noto_Naskh_Arabic({ subsets: ["arabic"], variable: "--font-ur", display: "swap" });

export const metadata: Metadata = {
  title: "Aurion Maintenance",
  description: "Issue & maintenance tracker for Aurion Hotels.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

// Inline, render-blocking: keeps the <meta theme-color> in sync with the
// resolved theme on first paint. The CSS handles "auto" via the
// prefers-color-scheme media query, so no class flip is needed here —
// this only fixes the browser chrome color to avoid a flash.
const THEME_COLOR_SCRIPT = `
(function(){
  try {
    var t = document.documentElement.getAttribute('data-theme');
    var dark = t === 'dark' || (t === 'auto' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', dark ? '#0a0a0a' : '#fbfaf7');
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const store = await cookies();
  const { lang, theme } = normalizePrefs(
    store.get(LANG_COOKIE)?.value,
    store.get(THEME_COOKIE)?.value,
  );

  return (
    <html
      lang={lang}
      dir={dirFor(lang)}
      data-theme={theme}
      className={`${geist.variable} ${geistMono.variable} ${notoBengali.variable} ${notoUrdu.variable}`}
    >
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <script dangerouslySetInnerHTML={{ __html: THEME_COLOR_SCRIPT }} />
      </head>
      <body>
        {/* Premium matte film-grain (dark only); pointer-events none. */}
        <div className="grain" aria-hidden />
        <LiquidGlassFilter />
        <ServiceWorker />
        <Providers initialLang={lang} initialTheme={theme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
