"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Logo } from "./Logo";
import { PasswordField } from "./PasswordField";
import { useLang } from "@/app/providers";
import { signInAction, type SignInState } from "@/app/login/actions";

const initialState: SignInState = { error: false };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn gold" type="submit" disabled={pending}>
      {label}
    </button>
  );
}

export function LoginForm() {
  const { t } = useLang();
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <div className="screen login aurora">
      <Logo variant="full" className="logo" size={60} />
      <h1>{t("appName")}</h1>
      <div className="tag">AURION HOTELS</div>

      <form className="glass" action={formAction}>
        <div className="field" style={{ marginBottom: 13 }}>
          <label htmlFor="username">{t("username")}</label>
          <input
            id="username"
            name="username"
            className="input"
            type="text"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="username"
          />
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="password">{t("password")}</label>
          <PasswordField name="password" />
        </div>

        <SubmitButton label={t("signin")} />

        {state.error && <div className="loginerr">{t("loginError")}</div>}
      </form>
    </div>
  );
}
