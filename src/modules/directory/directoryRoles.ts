/** Matches directory-svc `hrOrAdmin` (libs/rbac). */
export function isDirectoryHrOrAdmin(directoryRole: string | undefined | null): boolean {
  const r = (directoryRole ?? "").trim().toLowerCase();
  return r === "hr" || r === "admin";
}
