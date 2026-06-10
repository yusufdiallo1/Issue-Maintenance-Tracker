# Aurion Maintenance

Issue & maintenance tracker for Aurion Hotels — Next.js 16 (App Router) · TypeScript ·
Tailwind v4 · Supabase (Auth / Postgres + RLS / Storage / Realtime) · Groq (Whisper + LLM).

Bilingual (Arabic default, RTL) with light/dark themes, a voice-to-ticket flow, role-based
access (staff / admin), and an Apple "Liquid Glass" + Resend-style dark UI.

## Getting started

```bash
npm install
npm run check:env   # verify your .env before anything else
npm run dev         # http://localhost:3000
```

## Environment

Create `.env` (gitignored) with the four required variables — see `.env.example`:

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser | anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | admin actions; never sent to the client |
| `GROQ_API_KEY` | **server only** | Whisper + LLM; starts with `gsk_` |

`npm run check:env` fails loudly if any of these is missing or malformed.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier write / check |
| `npm run check:env` | Validate required env vars |
| `npm run seed` | Idempotent demo seed (accounts + sample issues + audit) |

## Health check

`GET /api/health` returns `{ "supabase": true, "groq": true }` when both services are
reachable (Supabase via a service-role `count` on `profiles`, Groq via a 1-token chat
call). Returns `503` if either is down. Use it for uptime monitoring / deploy smoke tests.

## Demo accounts (from the seed)

| Username | Password | Role |
| --- | --- | --- |
| `malsor` | `malsor123` | admin |
| `muhammad` / `khalid` / `noura` | `…123` | staff |

## Architecture notes

- **Auth:** username-only UI mapped to a synthetic `username@aurion.local` email; cookie
  sessions via `@supabase/ssr`; `middleware.ts` protects all routes.
- **RLS** on every table; deadline edits and team management are enforced server-side
  (admin check + service role), never trusted from the hidden UI.
- **Rooms** live in the `rooms` table (not a hardcoded constant) so the picker and CSV
  import share one source of truth.
- **Realtime** keeps the Reports / My-reports lists live; the `#liquidGlass` SVG filter +
  `LiquidTabs` power the glass material.
