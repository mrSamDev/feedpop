import { useQueries, useQueryClient } from "@tanstack/react-query";
import { fetchFeed } from "../api/feedApi";
import type { Feed, FeedSubscription, Article } from "../types";

/** Remap a fetched feed's IDs to use the subscription's stable UUID. */
function remapFeed(feed: Feed, subId: string): Feed {
  return {
    ...feed,
    id: subId,
    articles: feed.articles.map((a) => ({
      ...a,
      feedId: subId,
    })),
  };
}

function sortByDate(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
}

/** Dedupe by link+title hash, keep first occurrence (most recent after sort). */
function dedupeArticles(articles: Article[]): Article[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    if (!a.link && !a.title) return true;
    const key = `${a.link}::${a.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function flattenArticles(feeds: Feed[]): Article[] {
  return dedupeArticles(sortByDate(feeds.flatMap((f) => f.articles)));
}

export function useFeeds(subscriptions: FeedSubscription[]) {
  const queryClient = useQueryClient();

  const feedQueries = useQueries({
    queries: subscriptions.map((sub) => ({
      queryKey: ["feed", sub.id],
      queryFn: async () => {
        const feed = await fetchFeed(sub.url);
        return remapFeed(feed, sub.id);
      },
      staleTime: 5 * 60_000,
      retry: 1,
    })),
  });

  const feeds = feedQueries
    .map((q) => q.data)
    .filter((f): f is Feed => f !== undefined);

  const allArticles = flattenArticles(feeds);

  const isRefreshing = feedQueries.some((q) => q.isFetching);

  const lastSync = feeds.reduce<number | null>((max, f) => {
    if (f.lastFetchedAt === null) return max;
    return max === null ? f.lastFetchedAt : Math.max(max, f.lastFetchedAt);
  }, null);

  const feedError = feedQueries.find((q) => q.error && !q.data)?.error;

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  }

  function removeFeedQueries(id: string) {
    queryClient.removeQueries({ queryKey: ["feed", id] });
  }

  return {
    feeds,
    allArticles,
    isRefreshing,
    lastSync,
    feedError,
    handleRefresh,
    removeFeedQueries,
  };
}
