import type { DirectoryLocationRow } from "@/modules/directory/types";

/** Match grouped labels used on the edit form. */
export const LOCATION_GROUP_ORDER = ["Tanzania", "Kenya", "Uganda", "Rwanda"] as const;

/** Derive `countries.country_key` from a `locations.location_key` prefix. */
export function countryKeyFromLocationKey(locKey: string): string {
  const k = locKey.trim().toUpperCase();
  if (k.startsWith("TZ_")) return "TANZANIA";
  if (k.startsWith("KE_")) return "KENYA";
  if (k.startsWith("UG_")) return "UGANDA";
  if (k.startsWith("RW_")) return "RWANDA";
  return "";
}

export function buildLocationGroups(
  rows: DirectoryLocationRow[]
): { group: string; items: { value: string; label: string }[] }[] {
  const map = new Map<string, { value: string; label: string }[]>();
  for (const r of rows) {
    const g = (r.country_group || "Other").trim() || "Other";
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push({ value: r.location_key, label: r.name });
  }
  const out: { group: string; items: { value: string; label: string }[] }[] = [];
  for (const label of LOCATION_GROUP_ORDER) {
    const items = map.get(label);
    if (items?.length) out.push({ group: label, items });
    map.delete(label);
  }
  for (const [group, items] of map) {
    if (items.length) out.push({ group, items });
  }
  return out;
}
