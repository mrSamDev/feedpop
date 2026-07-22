const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

export function formatDate(ts: number | null): string {
  if (ts === null) return "";
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelative(ts: number | null): string {
  if (ts === null) return "";
  const diff = Date.now() - ts;
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  return `${Math.floor(diff / DAY)}d ago`;
}