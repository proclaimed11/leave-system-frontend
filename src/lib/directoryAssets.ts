/** Resolve stored paths like `/uploads/avatars/...` to an absolute URL using the directory API base. */
export function resolveDirectoryAssetUrl(href: string | null | undefined): string | undefined {
  const t = href?.trim();
  if (!t) return undefined;
  if (
    t.startsWith("http://") ||
    t.startsWith("https://") ||
    t.startsWith("data:") ||
    t.startsWith("blob:")
  ) {
    return t;
  }
  const base = (import.meta.env.VITE_DIRECTORY_API_URL ?? "http://localhost:3002").replace(
    /\/$/,
    ""
  );
  const path = t.startsWith("/") ? t : `/${t}`;
  return `${base}${path}`;
}
