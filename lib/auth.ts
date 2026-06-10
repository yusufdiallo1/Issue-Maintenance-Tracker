// ============================================================
// Auth helpers — username ↔ synthetic email mapping.
// The UI is username-only; under the hood every user has a synthetic
// email `${username}@aurion.local`. This email is NEVER shown in the UI.
// ============================================================

export const SYNTHETIC_EMAIL_DOMAIN = "aurion.local";

/** Map a username to its synthetic email (lowercased). */
export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

/** Recover the username from a synthetic email (for internal use only). */
export function emailToUsername(email: string): string {
  return email.split("@")[0] ?? "";
}
