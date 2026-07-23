import { useState } from "react";
import type { Article } from "./types";
import { useTheme } from "./hooks/useTheme";
import { useSubscriptions } from "./hooks/useSubscriptions";
import { useFeeds } from "./hooks/useFeeds";
import { useAddFeed } from "./hooks/useAddFeed";
import { useReadArticles } from "./hooks/useReadArticles";
import { extractErrorMessage } from "./api/feedApi";
import { useDailySummary } from "./hooks/useDailySummary";
import { DailyBrief } from "./components/DailyBrief";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { AddFeed } from "./components/AddFeed";
import { SourcesBar } from "./components/SourcesBar";
import { ArticleGrid } from "./components/ArticleGrid";
import { ArticleModal } from "./components/ArticleModal";

export function App() {
  const { theme, toggleTheme } = useTheme();
  const { subscriptions, addSubscription, removeSubscription } = useSubscriptions();
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [dismissedFeedError, setDismissedFeedError] = useState(false);

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
  const { summary: dailySummary, isGenerating: isSummaryGenerating, error: summaryError, generate: generateSummary, dismiss: dismissSummary } = useDailySummary();

  // Merge fetched feed titles into subscriptions for display
  const displaySubscriptions = subscriptions.map((sub) => {
    const feed = feeds.find((f) => f.url === sub.url);
    return feed ? { ...sub, title: feed.title } : sub;
  });

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

  function handleManualRefresh() {
    setDismissedFeedError(false);
    handleRefresh();
  }

  const isLoading = isRefreshing && feeds.length === 0;

  return (
    <ErrorBoundary>
      {/* Skip-to-content link — first focusable element (SC 2.4.1 Bypass Blocks) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:border-2 focus:border-ink focus:bg-panel-2 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink"
      >
        Skip to content
      </a>

      <div className="py-4 sm:py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 lg:flex-row">
          <aside className="order-2 lg:order-1 lg:w-56 lg:shrink-0">
            <SourcesBar
              feeds={displaySubscriptions}
              selectedId={selectedFeedId}
              onSelect={setSelectedFeedId}
              onRemove={handleRemoveFeed}
            />
          </aside>

          <main id="main-content" className="order-1 flex min-w-0 flex-1 flex-col gap-3 lg:order-2">
            <Header
              unreadCount={unreadCount(allArticles.map((a) => a.id))}
              sourceCount={subscriptions.length}
              lastSync={lastSync}
              isRefreshing={isRefreshing}
              theme={theme}
              onToggleTheme={toggleTheme}
              onRefresh={handleManualRefresh}
            />

            {/* Visually-hidden live region — announces loading state to SR users (SC 4.1.3) */}
            <span className="sr-only" aria-live="polite" aria-atomic="true">
              {isLoading ? "Loading your feeds" : isRefreshing ? "Refreshing feeds" : ""}
            </span>

            {/* Add-feed error — dismissable, announced to AT */}
            {addError && (
              <div
                role="alert"
                className="flex items-center justify-between gap-3 rounded-lg border border-pink-error/30 bg-pink-error/5 px-4 py-2.5 text-sm font-bold text-pink-error"
              >
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

            {/* Feed-load error — with retry, announced to AT */}
            {feedError && !addError && !dismissedFeedError && (
              <div
                role="alert"
                className="flex items-center justify-between gap-3 rounded-lg border border-pink-error/30 bg-pink-error/5 px-4 py-2.5 text-sm font-bold text-pink-error"
              >
                <span>{extractErrorMessage(feedError, "Failed to load one or more feeds.")}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualRefresh}
                    aria-label="Retry loading feeds"
                    className="rounded-md border border-pink-error/50 px-2.5 py-1 text-xs font-bold text-pink-error hover:bg-pink-error/10"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => setDismissedFeedError(true)}
                    aria-label="Dismiss"
                    className="text-pink-error hover:opacity-70"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <AddFeed isAdding={addMutation.isPending} onAdd={(url, title) => addMutation.mutate({ url, title })} />

            {dailySummary !== null && (
              <DailyBrief
                summary={dailySummary}
                onDismiss={dismissSummary}
              />
            )}

            {dailySummary === null && subscriptions.length > 0 && (
              <DailyBrief
                summary={null}
                isGenerating={isSummaryGenerating}
                error={summaryError}
                onGenerate={() => generateSummary(subscriptions.map((s) => s.url))}
                onDismiss={dismissSummary}
              />
            )}

            {isLoading && (
              <div className="panel px-5 py-10 text-center">
                <span className="text-base font-bold text-ink spin inline-block" aria-hidden="true">↻</span>
                <p className="mt-1.5 text-sm text-ink-muted">Loading your feeds…</p>
              </div>
            )}

            {!isLoading && feeds.length === 0 && subscriptions.length === 0 && (
              <div className="panel px-5 py-10 text-center">
                <h2
                  className="font-display text-lg font-extrabold text-ink"
                >
                  Welcome to FeedPop!
                </h2>
                <p className="mt-1.5 text-sm text-ink-muted">
                  Paste an RSS or Atom feed URL above to start collecting articles.
                </p>
              </div>
            )}

            {!isLoading && feeds.length > 0 && (
              <ArticleGrid
                key={selectedFeedId ?? "all"}
                articles={visibleArticles}
                onOpen={handleOpenArticle}
                readIds={readIds}
              />
            )}

            {!isLoading && feeds.length === 0 && subscriptions.length > 0 && (
              <div className="panel px-5 py-10 text-center">
                <h2 className="text-base font-bold text-ink">No articles loaded</h2>
                <p className="mt-1 text-sm text-ink-muted">Try refreshing your feeds.</p>
              </div>
            )}
          </main>
        </div>

        {selectedArticle && (
          <ErrorBoundary
            fallback={
              <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
                <div className="panel my-4 flex w-full max-w-2xl flex-col gap-3 p-5 text-center">
                  <p className="text-lg font-extrabold text-ink">Failed to display article</p>
                  <p className="text-sm text-ink-muted">The article content couldn't be rendered. Try the “Read original” link on the card.</p>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="btn btn-secondary mx-auto mt-2 px-5 py-2"
                  >
                    Close
                  </button>
                </div>
              </div>
            }
          >
            <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
          </ErrorBoundary>
        )}
      </div>
    </ErrorBoundary>
  );
}