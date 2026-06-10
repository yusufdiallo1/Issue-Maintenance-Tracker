// Service-role Supabase client — bypasses RLS. SERVER-ONLY.
// Used by admin server actions (user management) and never reachable from the
// client. `server-only` makes any client import a build error.
import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
