import "server-only";

// Web Push sender (VAPID). Server-only — uses the private VAPID key. Fire-and-
// forget from server actions so notifications never block the request.
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  urgent?: boolean;
};

type SubRow = { endpoint: string; p256dh: string; auth: string };

async function deliver(subs: SubRow[], payload: PushPayload) {
  const admin = createAdminClient();
  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
      } catch (err: unknown) {
        // 404/410 = expired subscription → prune it.
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
      }
    }),
  );
}

/** Send a push to every subscription of the given users. Best-effort. */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  if (!ensureConfigured() || !userIds.length) return;
  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", userIds);
  if (subs?.length) await deliver(subs, payload);
}

/**
 * Push to EVERY subscribed user except `exceptUserId` (the reporter), honoring
 * each user's notif_enabled preference. This is the "new issue → everyone"
 * fan-out. Best-effort, never throws.
 */
export async function sendPushToAllExcept(
  exceptUserId: string,
  payload: PushPayload,
): Promise<void> {
  if (!ensureConfigured()) return;
  const admin = createAdminClient();
  // Users who have notifications enabled (excluding the reporter).
  const { data: optedIn } = await admin
    .from("profiles")
    .select("id")
    .eq("notif_enabled", true)
    .neq("id", exceptUserId);
  const ids = (optedIn ?? []).map((p) => p.id);
  if (!ids.length) return;
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", ids);
  if (subs?.length) await deliver(subs, payload);
}

/** All admin user IDs (kept for any admin-only alerts). */
export async function adminUserIds(): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id").eq("role", "admin");
  return (data ?? []).map((p) => p.id);
}
