/**
 * Idempotent seed for the Aurion Maintenance database.
 *
 * Run with:  npm run seed
 * (Loads .env via Node's --env-file; uses the SERVICE ROLE key — server only.)
 *
 * - Creates the 4 demo auth users (synthetic emails) + their profiles.
 * - Seeds the prototype's 10 sample issues + sample audit rows, but ONLY if
 *   the issues table is empty (so re-running won't duplicate data).
 * - Backdates created_at using each row's "minutes ago" to match the
 *   prototype's relative ages.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const emailFor = (username: string) => `${username.toLowerCase()}@aurion.local`;

type Role = "admin" | "staff";
type SeedAccount = {
  username: string;
  password: string;
  fullName: string;
  role: Role;
};

// Admin display name matches the account: "Malsor".
const ACCOUNTS: SeedAccount[] = [
  { username: "malsor", password: "malsor123", fullName: "Malsor", role: "admin" },
  { username: "muhammad", password: "muhammad123", fullName: "Muhammad", role: "staff" },
  { username: "khalid", password: "khalid123", fullName: "Khalid", role: "staff" },
  { username: "noura", password: "noura123", fullName: "Noura", role: "staff" },
];

/**
 * Sample issues copied verbatim from the prototype. `min` = minutes ago (for
 * backdating created_at). `by` / `takenBy` are usernames resolved to profile
 * ids at insert time. Muhammad reports AC/305 (#1) and furniture/201 (#8), and
 * owns fridge/106 (#5) so his "My reports" tabs have content.
 */
type SeedIssue = {
  property: string;
  room: string;
  type: string;
  urgency: "urgent" | "soon" | "wait";
  status: "open" | "progress" | "done";
  en: string;
  ar: string;
  tags: string[];
  min: number;
  by: string; // username
  takenBy: string | null; // username
  deadline: "today" | "tomorrow" | "days3" | "week" | null;
  resolvedMin?: number;
};

const ISSUES: SeedIssue[] = [
  {
    property: "as_salaam",
    room: "305",
    type: "ac",
    urgency: "urgent",
    status: "open",
    en: "AC not cooling, guest is complaining about the heat.",
    ar: "المكيّف لا يبرّد، والنزيل يشتكي من الحرارة.",
    tags: ["vip"],
    min: 8,
    by: "muhammad",
    takenBy: null,
    deadline: "today",
  },
  {
    property: "quba",
    room: "19",
    type: "plumbing",
    urgency: "urgent",
    status: "open",
    en: "Toilet is overflowing onto the floor.",
    ar: "المرحاض يطفح على الأرض.",
    tags: ["safety"],
    min: 4,
    by: "noura",
    takenBy: null,
    deadline: null,
  },
  {
    property: "al_aqeeq",
    room: "204",
    type: "plumbing",
    urgency: "soon",
    status: "progress",
    en: "Bathroom sink is leaking under the cabinet.",
    ar: "حوض الحمّام يسرّب تحت الخزانة.",
    tags: ["parts"],
    min: 42,
    by: "khalid",
    takenBy: "khalid",
    deadline: "tomorrow",
  },
  {
    property: "quba",
    room: "12",
    type: "electrical",
    urgency: "urgent",
    status: "open",
    en: "Power outlet sparks when something is plugged in.",
    ar: "مقبس الكهرباء يُصدر شررًا عند توصيل أي جهاز.",
    tags: ["safety"],
    min: 16,
    by: "noura",
    takenBy: null,
    deadline: null,
  },
  {
    property: "as_salaam",
    room: "106",
    type: "appliances",
    urgency: "soon",
    status: "progress",
    en: "Mini-fridge is not getting cold.",
    ar: "الثلاجة الصغيرة لا تبرّد.",
    tags: [],
    min: 55,
    by: "noura",
    takenBy: "muhammad",
    deadline: null,
  },
  {
    property: "al_aqeeq",
    room: "102",
    type: "internet",
    urgency: "soon",
    status: "progress",
    en: "TV has no signal on most channels.",
    ar: "التلفاز بلا إشارة في معظم القنوات.",
    tags: ["recur"],
    min: 90,
    by: "khalid",
    takenBy: "khalid",
    deadline: null,
  },
  {
    property: "quba",
    room: "7",
    type: "cleaning",
    urgency: "wait",
    status: "open",
    en: "Carpet stain in the hallway near the room.",
    ar: "بقعة على السجاد في الممر قرب الغرفة.",
    tags: [],
    min: 120,
    by: "noura",
    takenBy: null,
    deadline: null,
  },
  {
    property: "as_salaam",
    room: "201",
    type: "furniture",
    urgency: "wait",
    status: "open",
    en: "Desk chair is broken and won't adjust.",
    ar: "كرسي المكتب مكسور ولا يُضبط.",
    tags: [],
    min: 175,
    by: "muhammad",
    takenBy: null,
    deadline: null,
  },
  {
    property: "al_aqeeq",
    room: "301",
    type: "ac",
    urgency: "soon",
    status: "done",
    en: "AC was making a loud rattling noise.",
    ar: "المكيّف كان يُصدر صوت طقطقة عاليًا.",
    tags: [],
    min: 340,
    by: "khalid",
    takenBy: "khalid",
    deadline: null,
    resolvedMin: 185,
  },
  {
    property: "as_salaam",
    room: "303",
    type: "other",
    urgency: "wait",
    status: "done",
    en: "Door lock is stiff and hard to turn.",
    ar: "قفل الباب قاسٍ ويصعب تدويره.",
    tags: ["recur"],
    min: 300,
    by: "noura",
    takenBy: "noura",
    deadline: null,
    resolvedMin: 410,
  },
];

type SeedAudit = {
  who: string; // username
  action: "report" | "take" | "done" | "deadline" | "addemp" | "rmemp" | "login";
  property?: string;
  room?: string;
  target?: string;
  min: number;
};

const AUDIT: SeedAudit[] = [
  { who: "muhammad", action: "report", property: "as_salaam", room: "305", min: 8 },
  { who: "muhammad", action: "take", property: "as_salaam", room: "106", min: 30 },
  { who: "noura", action: "report", property: "quba", room: "19", min: 4 },
  { who: "khalid", action: "take", property: "al_aqeeq", room: "204", min: 40 },
  { who: "malsor", action: "deadline", property: "al_aqeeq", room: "204", min: 38 },
  { who: "khalid", action: "take", property: "al_aqeeq", room: "102", min: 88 },
  { who: "noura", action: "done", property: "as_salaam", room: "303", min: 300 },
  { who: "khalid", action: "done", property: "al_aqeeq", room: "301", min: 340 },
  { who: "malsor", action: "addemp", target: "Noura", min: 600 },
];

const minutesAgoISO = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

async function findUserByEmail(email: string) {
  // Paginate through users (small dataset) to find a matching email.
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function ensureAccount(a: SeedAccount): Promise<string> {
  const email = emailFor(a.username);
  let user = await findUserByEmail(email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: a.password,
      email_confirm: true,
      user_metadata: { username: a.username, full_name: a.fullName },
    });
    if (error) throw error;
    user = data.user;
    console.log(`  created auth user: ${a.username}`);
  } else {
    console.log(`  auth user exists: ${a.username}`);
  }

  // Upsert the profile (id = auth user id).
  const { error: pErr } = await admin.from("profiles").upsert(
    {
      id: user.id,
      username: a.username,
      full_name: a.fullName,
      role: a.role,
    },
    { onConflict: "id" },
  );
  if (pErr) throw pErr;
  return user.id;
}

async function main() {
  console.log("Seeding accounts…");
  const idByUsername = new Map<string, string>();
  for (const a of ACCOUNTS) {
    const id = await ensureAccount(a);
    idByUsername.set(a.username, id);
  }

  // Only seed sample issues/audit if issues is empty (idempotent).
  const { count, error: cErr } = await admin
    .from("issues")
    .select("*", { count: "exact", head: true });
  if (cErr) throw cErr;

  if ((count ?? 0) > 0) {
    console.log(`Issues table already has ${count} rows — skipping sample data.`);
    console.log("Done.");
    return;
  }

  console.log("Seeding sample issues…");
  const issueRows = ISSUES.map((i) => ({
    property: i.property,
    room: i.room,
    type: i.type,
    urgency: i.urgency,
    status: i.status,
    description: i.en,
    description_ar: i.ar,
    tags: i.tags,
    reported_by: idByUsername.get(i.by)!,
    taken_by: i.takenBy ? idByUsername.get(i.takenBy)! : null,
    deadline: i.deadline,
    resolved_minutes: i.resolvedMin ?? null,
    created_at: minutesAgoISO(i.min),
    resolved_at:
      i.status === "done" && i.resolvedMin != null
        ? minutesAgoISO(Math.max(0, i.min - i.resolvedMin))
        : null,
  }));
  const { error: iErr } = await admin.from("issues").insert(issueRows);
  if (iErr) throw iErr;
  console.log(`  inserted ${issueRows.length} issues`);

  console.log("Seeding audit log…");
  const auditRows = AUDIT.map((e) => {
    const id = idByUsername.get(e.who) ?? null;
    const acct = ACCOUNTS.find((a) => a.username === e.who);
    return {
      actor: id,
      actor_name: acct?.fullName ?? e.who,
      action: e.action,
      target_property: e.property ?? null,
      target_room: e.room ?? null,
      target_text: e.target ?? null,
      created_at: minutesAgoISO(e.min),
    };
  });
  const { error: aErr } = await admin.from("audit_log").insert(auditRows);
  if (aErr) throw aErr;
  console.log(`  inserted ${auditRows.length} audit rows`);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
