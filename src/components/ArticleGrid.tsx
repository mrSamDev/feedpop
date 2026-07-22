import type { Article } from "../types";
import { ArticleCard } from "./ArticleCard";

interface ArticleGridProps {
  articles: Article[];
  onOpen: (article: Article) => void;
}

export function ArticleGrid({ articles, onOpen }: ArticleGridProps) {
  if (articles.length === 0) {
    return (
      <div className="panel px-5 py-10 text-center">
        <p className="text-base font-bold text-ink">No articles yet</p>
        <p className="mt-1 text-sm text-ink-60">Add a feed URL above to start reading.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} onOpen={onOpen} />
      ))}
    </div>
  );
}