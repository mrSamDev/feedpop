import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFeed } from "../api/feedApi";
import { extractErrorMessage, remapFeed } from "../transformers/feedTransformer";
import type { Feed, FeedSubscription } from "../types";

interface UseAddFeedCallbacks {
  onFeedAdded: (feed: Feed) => void;
  onFeedError: (message: string) => void;
}

export function useAddFeed(subscriptions: FeedSubscription[], callbacks: UseAddFeedCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => fetchFeed(url),
    onSuccess: (feed) => {
      // Find the subscription that matches this feed URL
      const sub = subscriptions.find((s) => s.url === feed.url);
      if (sub) {
        const remapped = remapFeed(feed, sub.id);
        queryClient.setQueryData(["feed", sub.id], remapped);
        callbacks.onFeedAdded(remapped);
      } else {
        // Shouldn't happen — subscription is created after fetch
        queryClient.setQueryData(["feed", feed.url], feed);
        callbacks.onFeedAdded(feed);
      }
    },
    onError: (e) => {
      callbacks.onFeedError(extractErrorMessage(e, "Something went wrong. Please try again."));
    },
  });
}
