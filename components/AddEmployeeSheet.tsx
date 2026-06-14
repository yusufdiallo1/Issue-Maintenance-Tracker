"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Sheet } from "./Sheet";
import { PasswordField } from "./PasswordField";
import { useLang } from "@/app/providers";
import { PROPS } from "@/lib/i18n/dictionary";
import { addEmployee } from "@/app/actions/employees";

export function AddEmployeeSheet({
  open,
  enter,
  onClose,
  onAdded,
}: {
  open: boolean;
  enter: boolean;
  onClose: () => void;
  onAdded: (name: string) => void;
}) {
  const { t, lang } = useLang();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [language, setLanguage] = useState<"ar" | "en" | "bn" | "ur">("ar");
  const [properties, setProperties] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  const toggleProp = (code: string) =>
    setProperties((p) => (p.includes(code) ? p.filter((c) => c !== code) : [...p, code]));

  const LANGS: { id: "ar" | "en" | "bn" | "ur"; label: string }[] = [
    { id: "ar", label: "العربية" },
    { id: "en", label: "English" },
    { id: "bn", label: "বাংলা" },
    { id: "ur", label: "اردو" },
  ];

  if (!open) {
    return (
      <Sheet open={false} enter={false} onClose={onClose}>
        {null}
      </Sheet>
    );
  }

  function save(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    if (!name.trim() || !username.trim() || !password.trim()) return;
    setError(false);
    startTransition(async () => {
      const res = await addEmployee({
        fullName: name,
        username,
        password,
        role,
        language,
        properties,
        title: title.trim() || null,
      });
      if (res.ok) {
        const added = name.trim();
        setName("");
        setUsername("");
        setRole("staff");
        setLanguage("ar");
        setProperties([]);
        setTitle("");
        onAdded(added);
      } else {
        setError(true);
      }
    });
  }

  return (
    <Sheet open={open} enter={enter} onClose={onClose} title={t("addEmployee")}>
      <form action={save}>
        <div className="field" style={{ marginTop: 12 }}>
          <label>{t("name")}</label>
          <input className="inset-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>{t("username")}</label>
          <input
            className="inset-input"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="field">
          <label>{t("password")}</label>
          <PasswordField name="password" className="inset-input" />
        </div>
        <div className="field">
          <label>{t("role")}</label>
          <div className="seg" style={{ width: "100%" }}>
            <button
              type="button"
              className={role === "staff" ? "on" : ""}
              onClick={() => setRole("staff")}
            >
              {t("staff")}
            </button>
            <button
              type="button"
              className={role === "admin" ? "on" : ""}
              onClick={() => setRole("admin")}
            >
              {t("admin")}
            </button>
          </div>
        </div>
        <div className="field">
          <label>{t("speaksLang")}</label>
          <div className="seg seg-lang" style={{ width: "100%" }}>
            {LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                className={language === l.id ? "on" : ""}
                onClick={() => setLanguage(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>{t("assignedProps")}</label>
          <div className="room-tabs" style={{ margin: "6px 0 0" }}>
            {PROPS.map((p) => (
              <button
                key={p.code}
                type="button"
                className={properties.includes(p.code) ? "rt on" : "rt"}
                onClick={() => toggleProp(p.code)}
              >
                {p[lang]}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>{t("jobTitle")}</label>
          <input
            className="inset-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("jobTitlePh")}
          />
        </div>
        <button
          className="btn gold"
          type="submit"
          disabled={pending || !name.trim() || !username.trim()}
        >
          <Check />
          {t("addEmployee")}
        </button>
        {error && <div className="loginerr">{t("loginError")}</div>}
      </form>
    </Sheet>
  );
}
