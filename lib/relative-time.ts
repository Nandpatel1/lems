/** Anything past this is stale enough that a date beats "9 days ago". */
const RELATIVE_LIMIT_MS = 6 * 24 * 60 * 60 * 1000;

/** How long ago, in the shortest form that still says something useful.
 *  Used wherever recency is the point — notification rows, topic activity —
 *  so the whole app ages things at the same rate. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < RELATIVE_LIMIT_MS) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** An absolute date, for things whose age isn't the point — when a topic was
 *  started, say, where "5d ago" invites arithmetic nobody wanted to do. */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}
