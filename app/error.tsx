"use client";

// Global route error boundary — bilingual, no white screen. Reads the lang
// cookie directly (it sits outside the Providers tree on error).
import { useEffect } from "react";
import { RotateCw } from "lucide-react";

function readLang(): "ar" | "en" {
  if (typeof document === "undefined") return "ar";
  return document.cookie.includes("aurion_lang=en") ? "en" : "ar";
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const ar = readLang() === "ar";
  return (
    <div className="errbox" dir={ar ? "rtl" : "ltr"}>
      <div className="errcard glass">
        <h2>{ar ? "حدث خطأ ما" : "Something went wrong"}</h2>
        <p>
          {ar
            ? "تعذّر تحميل هذا القسم. حاول مرة أخرى."
            : "We couldn't load this section. Please try again."}
        </p>
        <button className="btn gold" style={{ maxWidth: 200 }} onClick={reset}>
          <RotateCw />
          {ar ? "إعادة المحاولة" : "Try again"}
        </button>
      </div>
    </div>
  );
}
