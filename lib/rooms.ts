// Rooms now live in the DB (public.rooms) rather than a hardcoded constant, so
// the room picker and CSV import read the same source of truth.
import { createClient } from "@/lib/supabase/server";

export type RoomsByProperty = Record<string, string[]>;

/** Natural sort so "2" < "10" and "101" < "102". */
function naturalRoomSort(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return a.localeCompare(b);
}

/** All rooms grouped by property code, each list naturally sorted. */
export async function fetchRoomsByProperty(): Promise<RoomsByProperty> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("rooms").select("property, room");
  if (error) throw error;
  const map: RoomsByProperty = {};
  for (const { property, room } of data ?? []) {
    (map[property] ??= []).push(room);
  }
  for (const key of Object.keys(map)) map[key].sort(naturalRoomSort);
  return map;
}
