/**
 * Fails loudly if any required env var is missing or obviously malformed.
 * Run with:  npm run check:env
 */
type Check = {
  name: string;
  value: string | undefined;
  valid: (v: string) => boolean;
  hint: string;
};

const checks: Check[] = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    value: process.env.NEXT_PUBLIC_SUPABASE_URL,
    valid: (v) => /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(v),
    hint: "should look like https://<ref>.supabase.co",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    valid: (v) => v.length > 20,
    hint: "the anon/publishable key",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    value: process.env.SUPABASE_SERVICE_ROLE_KEY,
    valid: (v) => v.length > 20,
    hint: "the service-role secret (server-only)",
  },
  {
    name: "GROQ_API_KEY",
    value: process.env.GROQ_API_KEY,
    valid: (v) => v.startsWith("gsk_") && v.length > 20,
    hint: "should start with gsk_",
  },
  {
    name: "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
    value: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    valid: (v) => v.length > 80,
    hint: "Web Push public key — `npx web-push generate-vapid-keys`",
  },
  {
    name: "VAPID_PRIVATE_KEY",
    value: process.env.VAPID_PRIVATE_KEY,
    valid: (v) => v.length > 20,
    hint: "Web Push private key (server-only)",
  },
  {
    name: "VAPID_SUBJECT",
    value: process.env.VAPID_SUBJECT,
    valid: (v) => v.startsWith("mailto:") || v.startsWith("https://"),
    hint: "should start with mailto: or https://",
  },
];

let failed = false;
for (const c of checks) {
  if (!c.value) {
    console.error(`✖ ${c.name} is MISSING — ${c.hint}`);
    failed = true;
  } else if (!c.valid(c.value)) {
    console.error(`✖ ${c.name} looks MALFORMED — ${c.hint}`);
    failed = true;
  } else {
    console.log(`✓ ${c.name}`);
  }
}

if (failed) {
  console.error("\nEnvironment check FAILED. Fix the above in .env before continuing.");
  process.exit(1);
}
console.log("\nAll required environment variables are present and well-formed.");
