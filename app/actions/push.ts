"use server";

// Save / remove a browser push subscription for the current user.
import { getCurrentProfile } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
  platform?: string;
}): Promise<{ ok: boolean }> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false };
  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: me.id,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      platform: sub.platform ?? "web",
    },
    { onConflict: "endpoint" },
  );
  return { ok: !error };
}

/** Persist a user's notification preferences (push on/off + in-app sound). */
export async function setNotifPrefs(prefs: {
  enabled?: boolean;
  sound?: boolean;
}): Promise<{ ok: boolean }> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false };
  const admin = createAdminClient();
  const patch: { notif_enabled?: boolean; notif_sound?: boolean } = {};
  if (typeof prefs.enabled === "boolean") patch.notif_enabled = prefs.enabled;
  if (typeof prefs.sound === "boolean") patch.notif_sound = prefs.sound;
  const { error } = await admin.from("profiles").update(patch).eq("id", me.id);
  return { ok: !error };
}

export async function removePushSubscription(endpoint: string): Promise<{ ok: boolean }> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false };
  const admin = createAdminClient();
  const { error } = await admin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", me.id);
  return { ok: !error };
}
