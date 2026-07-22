import { useEffect, useState } from "react";
import { useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Feed, Article, FeedSubscription } from "./types";
import { loadFeeds, saveFeeds } from "./lib/storage";
import { fetchFeed, FeedFetchError } from "./lib/feedService";
import { useTheme } from "./lib/theme";
import { Header } from "./components/Header";
import { AddFeed } from "./components/AddFeed";
import { SourcesBar } from "./components/SourcesBar";
import { ArticleGrid } from "./components/ArticleGrid";
import { ArticleModal } from "./components/ArticleModal";

function makeSubscription(feed: Feed): FeedSubscription {
  return { id: feed.url, url: feed.url, title: feed.title, addedAt: Date.now() };
}

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof FeedFetchError ? e.message : fallback;
}

function sortByDate(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
}

export function App() {
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const [subscriptions, setSubscriptions] = useState<FeedSubscription[]>(() => loadFeeds());
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveFeeds(subscriptions);
  }, [subscriptions]);

  const feedQueries = useQueries({
    queries: subscriptions.map((sub) => ({
      queryKey: ["feed", sub.url],
      queryFn: () => fetchFeed(sub.url),
      staleTime: 5 * 60_000,
      retry: 1,
    })),
  });

  const feeds = feedQueries
    .map((q) => q.data)
    .filter((f): f is Feed => f !== undefined);

  const allArticles = sortByDate(feeds.flatMap((f) => f.articles));
  const visibleArticles = selectedFeedId
    ? allArticles.filter((a) => a.feedId === selectedFeedId)
    : allArticles;

  const isRefreshing = feedQueries.some((q) => q.isFetching);
  const lastSync = feeds.reduce<number | null>((max, f) => {
    if (f.lastFetchedAt === null) return max;
    return max === null ? f.lastFetchedAt : Math.max(max, f.lastFetchedAt);
  }, null);

  const feedError = feedQueries.find((q) => q.error && !q.data)?.error;

  const addMutation = useMutation({
    mutationFn: (url: string) => fetchFeed(url),
    onSuccess: (feed) => {
      queryClient.setQueryData(["feed", feed.url], feed);
      setSubscriptions((prev) =>
        prev.some((s) => s.url === feed.url) ? prev : [...prev, makeSubscription(feed)],
      );
    },
    onError: (e) => setError(errorMessage(e, "Something went wrong. Please try again.")),
  });

  function handleRemoveFeed(id: string) {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    queryClient.removeQueries({ queryKey: ["feed", id] });
    if (selectedFeedId === id) setSelectedFeedId(null);
  }

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  }

  // Sync subscription titles with fetched feed titles
  useEffect(() => {
    if (feeds.length === 0) return;
    setSubscriptions((prev) => {
      let changed = false;
      const next = prev.map((s) => {
        const feed = feeds.find((f) => f.url === s.url);
        if (feed && feed.title !== s.title) {
          changed = true;
          return { ...s, title: feed.title };
        }
        return s;
      });
      return changed ? next : prev;
    });
  }, [feeds]);

  const hasError = error || feedError;
  const isLoading = isRefreshing && feeds.length === 0;

  return (
    <div className="py-4 sm:py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 lg:flex-row">
        {/* Sidebar — sources/feeds list (left on desktop, below main on mobile) */}
        <aside className="order-2 lg:order-1 lg:w-56 lg:shrink-0">
          <SourcesBar
            feeds={subscriptions}
            selectedId={selectedFeedId}
            onSelect={setSelectedFeedId}
            onRemove={handleRemoveFeed}
          />
        </aside>

        {/* Main content — header + add feed box + articles */}
        <main className="order-1 flex min-w-0 flex-1 flex-col gap-3 lg:order-2">
          <Header
            unreadCount={allArticles.length}
            sourceCount={subscriptions.length}
            lastSync={lastSync}
            isRefreshing={isRefreshing}
            theme={theme}
            onToggleTheme={toggleTheme}
            onRefresh={handleRefresh}
          />

          {hasError && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-pink-error/30 bg-pink-error/5 px-4 py-2.5 text-sm font-bold text-pink-error">
              <span>{error ?? errorMessage(feedError, "Failed to load one or more feeds.")}</span>
              <button
                onClick={() => {
                  setError(null);
                  queryClient.invalidateQueries({ queryKey: ["feed"] });
                }}
                aria-label="Dismiss error"
                className="text-pink-error hover:opacity-70"
              >
                ✕
              </button>
            </div>
          )}

          <AddFeed isAdding={addMutation.isPending} onAdd={addMutation.mutate} />

          {isLoading && (
            <div className="panel px-5 py-10 text-center">
              <span className="text-base font-bold text-ink spin inline-block">↻</span>
              <p className="mt-1.5 text-sm text-ink-60">Loading your feeds…</p>
            </div>
          )}

          {!isLoading && feeds.length === 0 && subscriptions.length === 0 && (
            <div className="panel px-5 py-10 text-center">
              <p className="text-lg font-extrabold text-ink"
                 style={{ fontFamily: "Baloo 2, ui-rounded, system-ui, sans-serif" }}>
                Welcome to FeedPop!
              </p>
              <p className="mt-1.5 text-sm text-ink-60">
                Paste an RSS or Atom feed URL above to start collecting articles.
              </p>
            </div>
          )}

          {!isLoading && feeds.length > 0 && (
            <ArticleGrid articles={visibleArticles} onOpen={setSelectedArticle} />
          )}

          {!isLoading && feeds.length === 0 && subscriptions.length > 0 && (
            <div className="panel px-5 py-10 text-center">
              <p className="text-base font-bold text-ink">No articles loaded</p>
              <p className="mt-1 text-sm text-ink-60">Try refreshing your feeds.</p>
            </div>
          )}
        </main>
      </div>

      {selectedArticle && (
        <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
    </div>
  );
}