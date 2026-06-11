"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Sparkles, AlertTriangle, Check } from "lucide-react";

type ToastKind = "info" | "success" | "error";
type Toast = { id: number; message: string; kind: ToastKind };
type ToastCtx = { show: (message: string, kind?: ToastKind) => void };

const Ctx = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

/**
 * Global toast system, rendered in a fixed layer ABOVE the app so it never
 * remounts a screen (and therefore never retriggers the gated entry
 * animation). Reuses the prototype's `.toast` styling.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const show = useCallback((message: string, kind: ToastKind = "info") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 2800);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="toast-layer" aria-live="polite" aria-atomic="false">
        {toasts.map((x) => (
          <div key={x.id} className={`toast toast-${x.kind}`} role="status">
            {x.kind === "error" ? (
              <AlertTriangle />
            ) : x.kind === "success" ? (
              <Check />
            ) : (
              <Sparkles />
            )}
            <span>{x.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
