import { useState, useEffect } from "react";
import type { Article } from "../types";
import { ArticleCard } from "./ArticleCard";

const PAGE_SIZE = 30;

interface ArticleGridProps {
  articles: Article[];
  onOpen: (article: Article) => void;
  readIds: Set<string>;
}

export function ArticleGrid({ articles, onOpen, readIds }: ArticleGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset pagination when articles change (e.g., feed filter)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [articles.length]);

  if (articles.length === 0) {
    return (
      <div className="panel px-5 py-10 text-center">
        <p className="text-base font-bold text-ink">No articles yet</p>
        <p className="mt-1 text-sm text-ink-60">Add a feed URL above to start reading.</p>
      </div>
    );
  }

  const visible = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onOpen={onOpen}
            isRead={readIds.has(article.id)}
          />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="btn btn-secondary px-6 py-2"
          >
            Load more ({articles.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
