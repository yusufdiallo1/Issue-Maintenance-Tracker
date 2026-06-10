import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentProfile } from "@/lib/session";
import { fetchIssues, fetchProfiles, fetchTeam, fetchAudit } from "@/lib/data";

// Home: the authenticated app shell. Middleware guarantees a session; we
// resolve the profile + all screen data here and hand it to the shell.
export default async function Home() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const isAdmin = profile.role === "admin";

  const [issues, profiles, team, audit] = await Promise.all([
    fetchIssues(),
    fetchProfiles(),
    isAdmin ? fetchTeam() : Promise.resolve([]),
    isAdmin ? fetchAudit() : Promise.resolve([]),
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
    />
  );
}
