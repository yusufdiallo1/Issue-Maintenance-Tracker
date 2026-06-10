"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Password input with an eye toggle that is INVISIBLE until ≥1 character is
 * typed (matches the prototype). Clicking it toggles visibility and swaps the
 * eye / eye-off icon. The actual value posts via the form (name=password).
 */
export function PasswordField({
  name = "password",
  className = "input",
  placeholder,
  autoFocus,
}: {
  name?: string;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  const [shown, setShown] = useState(false);
  const hasText = value.length > 0;

  return (
    <div className="pwrap">
      <input
        className={className}
        name={name}
        type={shown ? "text" : "password"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      <button
        type="button"
        className="eye"
        style={{ display: hasText ? "grid" : "none" }}
        aria-label={shown ? "Hide password" : "Show password"}
        onClick={() => setShown((s) => !s)}
        tabIndex={-1}
      >
        {shown ? <EyeOff /> : <Eye />}
      </button>
    </div>
  );
}
