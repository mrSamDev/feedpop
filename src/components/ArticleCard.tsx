import { useId } from "react";
import type { Article } from "../types";
import { formatRelative } from "../lib/format";
import { estimateReadTime, wordCount } from "../lib/articleMetrics";

interface ArticleCardProps {
  article: Article;
  onOpen: (article: Article) => void;
  isRead: boolean;
}

const FRESH_THRESHOLD_MS = 86_400_000; // 24 hours in milliseconds

export function ArticleCard({ article, onOpen, isRead }: ArticleCardProps) {
  const isFresh = article.publishedAt !== null && Date.now() - article.publishedAt < FRESH_THRESHOLD_MS;
  const minutes = estimateReadTime(article.content);
  const words = wordCount(article.content);
  const titleId = useId();

  // Fold read/fresh state into the accessible name so screen-reader users can
  // distinguish read from unread articles (SC 1.4.1 — not colour-only).
  const statusLabel = `${isRead ? "read" : "unread"}${isFresh ? ", fresh" : ""}`;

  return (
    <article
      className={`card fade-in flex flex-col gap-2 p-3 ${isRead ? "opacity-50" : ""}`}
      onClick={() => onOpen(article)}
      role="button"
      tabIndex={0}
      aria-labelledby={titleId}
      aria-description={statusLabel}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(article);
        }
      }}
    >
      {/* Thumbnail — compact, only if image exists */}
      {article.imageUrl && (
        <img
          src={article.imageUrl}
          alt=""
          className="h-20 w-full rounded-lg border border-ink object-cover"
          loading="lazy"
        />
      )}

      {/* Metadata chips row */}
      <div className="flex items-center gap-1.5">
        <span className="chip chip-article">Article</span>
        {article.publishedAt && (
          <span className="chip chip-neutral">{formatRelative(article.publishedAt)}</span>
        )}
        {isFresh && (
          <span className="fresh-dot" role="img" aria-label="Fresh post" title="Fresh post" />
        )}
      </div>

      {/* Title — compact display font, 2-line clamp */}
      <h2
        id={titleId}
        className="font-display line-clamp-2 text-[1.05rem] font-bold leading-[1.2] text-ink"
      >
        {article.title}
      </h2>

      {/* Excerpt — 2-line clamp, small body text */}
      {article.description && (
        <p className="line-clamp-2 text-[0.85rem] leading-snug text-ink-80">{article.description}</p>
      )}

      {/* Footer: source + read time — small chips, no button */}
      <div className="mt-auto flex items-center gap-1.5 pt-1">
        <span className="chip chip-neutral">{minutes} min read</span>
        <span className="chip chip-neutral">{words} words</span>
      </div>

    </article>
  );
}