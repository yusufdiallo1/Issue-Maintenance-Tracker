import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentProfile } from "@/lib/session";
import { fetchIssues, fetchProfiles, fetchTeam, fetchAudit } from "@/lib/data";
import { fetchRoomsByProperty } from "@/lib/rooms";

// Home: the authenticated app shell. Middleware guarantees a session; we
// resolve the profile + all screen data here and hand it to the shell.
export default async function Home() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const isAdmin = profile.role === "admin";

  const [issues, profiles, team, audit, roomsByProperty] = await Promise.all([
    fetchIssues(),
    fetchProfiles(),
    isAdmin ? fetchTeam() : Promise.resolve([]),
    isAdmin ? fetchAudit(500) : Promise.resolve([]),
    fetchRoomsByProperty(),
  ]);

  return (
    <AppShell
      userName={profile.full_name}
      role={profile.role}
      currentUserId={profile.id}
      issues={issues}
      profiles={profiles}
      team={team}
      audit={audit}
      roomsByProperty={roomsByProperty}
      notifEnabled={profile.notif_enabled}
      notifSound={profile.notif_sound}
    />
  );
}
