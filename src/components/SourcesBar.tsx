import type { FeedSubscription } from "../types";

interface SourcesBarProps {
  feeds: FeedSubscription[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
}

export function SourcesBar({ feeds, selectedId, onSelect, onRemove }: SourcesBarProps) {
  if (feeds.length === 0) return null;

  return (
    <nav className="panel fade-in flex flex-col gap-1 p-3">
      <span className="mb-1 px-2 text-[0.7rem] font-bold uppercase tracking-[0.06em] text-ink-60">
        Sources
      </span>

      <button
        onClick={() => onSelect(null)}
        aria-current={selectedId === null ? "true" : undefined}
        className="flex items-center justify-between gap-2 rounded-md border border-transparent px-2 py-1.5 text-left text-sm font-bold text-ink transition-colors hover:bg-surface aria-[current=true]:bg-mint aria-[current=true]:border-ink"
      >
        <span>All feeds</span>
      </button>

      <ul className="flex flex-col gap-0.5">
        {feeds.map((feed) => (
          <li key={feed.id} className="group flex items-center gap-1">
            <button
              onClick={() => onSelect(feed.id)}
              aria-current={selectedId === feed.id ? "true" : undefined}
              className="min-w-0 flex-1 truncate rounded-md border border-transparent px-2 py-1.5 text-left text-sm font-bold text-ink transition-colors hover:bg-surface aria-[current=true]:bg-mint aria-[current=true]:border-ink"
              title={feed.title}
            >
              {feed.title}
            </button>
            <button
              onClick={() => onRemove(feed.id)}
              aria-label={`Remove ${feed.title}`}
              className="shrink-0 rounded-full border border-ink bg-panel-2 px-1 text-[0.6rem] font-bold text-ink opacity-0 transition-opacity hover:text-pink-error group-hover:opacity-100 group-focus-within:opacity-100"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
