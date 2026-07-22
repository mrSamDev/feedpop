import { formatRelative } from "../lib/format";
import type { Theme } from "../hooks/useTheme";

interface HeaderProps {
  unreadCount: number;
  sourceCount: number;
  lastSync: number | null;
  isRefreshing: boolean;
  theme: Theme;
  onToggleTheme: () => void;
  onRefresh: () => void;
}

export function Header({
  unreadCount,
  sourceCount,
  lastSync,
  isRefreshing,
  theme,
  onToggleTheme,
  onRefresh,
}: HeaderProps) {
  return (
    <header className="panel fade-in flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-extrabold leading-tight text-ink"
            style={{ fontFamily: "Baloo 2, ui-rounded, system-ui, sans-serif" }}>
          FeedPop
        </h1>
        <div className="hidden items-center gap-2 sm:flex">
          <StatPill label="unread" value={unreadCount} />
          <StatPill label="sources" value={sourceCount} />
          <StatPill label="sync" value={lastSync ? formatRelative(lastSync) : "—"} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          className="btn btn-secondary px-3 py-2"
        >
          {theme === "light" ? "☾" : "☀"}
        </button>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh feeds"
          className="btn btn-refresh px-4 py-2"
        >
          {isRefreshing ? "Syncing…" : "↻ Refresh"}
        </button>
      </div>
    </header>
  );
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="stat-pill">
      <span className="text-sm font-extrabold text-ink">{value}</span>
      <span className="text-[0.65rem] font-bold uppercase tracking-[0.06em] text-ink-60">{label}</span>
    </span>
  );
}