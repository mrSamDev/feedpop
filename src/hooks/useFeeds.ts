import { useQueries, useQueryClient } from "@tanstack/react-query";
import { fetchFeed } from "../api/feedApi";
import { flattenArticles, remapFeed } from "../transformers/feedTransformer";
import type { Feed, FeedSubscription } from "../types";

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
