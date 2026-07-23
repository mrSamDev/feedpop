import { useEffect, useState } from "react";
import type { Article } from "./types";
import { useTheme } from "./hooks/useTheme";
import { useSubscriptions } from "./hooks/useSubscriptions";
import { useFeeds } from "./hooks/useFeeds";
import { useAddFeed } from "./hooks/useAddFeed";
import { useReadArticles } from "./hooks/useReadArticles";
import { extractErrorMessage } from "./api/feedApi";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { AddFeed } from "./components/AddFeed";
import { SourcesBar } from "./components/SourcesBar";
import { ArticleGrid } from "./components/ArticleGrid";
import { ArticleModal } from "./components/ArticleModal";

export function App() {
  const { theme, toggleTheme } = useTheme();
  const { subscriptions, addSubscription, removeSubscription, syncTitles } = useSubscriptions();
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const {
    feeds,
    allArticles,
    isRefreshing,
    lastSync,
    feedError,
    handleRefresh,
    removeFeedQueries,
  } = useFeeds(subscriptions);

  const addMutation = useAddFeed({
    onFeedAdded: addSubscription,
    onFeedError: (msg: string) => setAddError(msg),
  });

  const { readIds, markRead, unreadCount } = useReadArticles();

  // Sync subscription titles with fetched feed titles
  useEffect(() => {
    syncTitles(feeds);
  }, [feeds, syncTitles]);

  const visibleArticles = selectedFeedId
    ? allArticles.filter((a) => a.feedId === selectedFeedId)
    : allArticles;

  function handleRemoveFeed(id: string) {
    removeSubscription(id);
    removeFeedQueries(id);
    if (selectedFeedId === id) setSelectedFeedId(null);
  }

  function handleOpenArticle(article: Article) {
    markRead(article.id);
    setSelectedArticle(article);
  }

  const isLoading = isRefreshing && feeds.length === 0;

  return (
    <ErrorBoundary>
      <div className="py-4 sm:py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 lg:flex-row">
          <aside className="order-2 lg:order-1 lg:w-56 lg:shrink-0">
            <SourcesBar
              feeds={subscriptions}
              selectedId={selectedFeedId}
              onSelect={setSelectedFeedId}
              onRemove={handleRemoveFeed}
            />
          </aside>

          <main className="order-1 flex min-w-0 flex-1 flex-col gap-3 lg:order-2">
            <Header
              unreadCount={unreadCount(allArticles.length)}
              sourceCount={subscriptions.length}
              lastSync={lastSync}
              isRefreshing={isRefreshing}
              theme={theme}
              onToggleTheme={toggleTheme}
              onRefresh={handleRefresh}
            />

            {/* Add-feed error — dismissable, no side effects */}
            {addError && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-pink-error/30 bg-pink-error/5 px-4 py-2.5 text-sm font-bold text-pink-error">
                <span>{addError}</span>
                <button
                  onClick={() => setAddError(null)}
                  aria-label="Dismiss error"
                  className="text-pink-error hover:opacity-70"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Feed-load error — with retry */}
            {feedError && !addError && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-pink-error/30 bg-pink-error/5 px-4 py-2.5 text-sm font-bold text-pink-error">
                <span>{extractErrorMessage(feedError, "Failed to load one or more feeds.")}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefresh}
                    aria-label="Retry loading feeds"
                    className="rounded-md border border-pink-error/50 px-2.5 py-1 text-xs font-bold text-pink-error hover:bg-pink-error/10"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => handleRefresh()}
                    aria-label="Dismiss"
                    className="text-pink-error hover:opacity-70"
                  >
                    ✕
                  </button>
                </div>
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
              <ArticleGrid articles={visibleArticles} onOpen={handleOpenArticle} readIds={readIds} />
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
    </ErrorBoundary>
  );
}
