import { useMutation } from "@tanstack/react-query";
import { fetchFeed, extractErrorMessage } from "../api/feedApi";
import type { Feed } from "../types";

interface UseAddFeedCallbacks {
  onFeedAdded: (feed: Feed) => void;
  onFeedError: (message: string) => void;
}

interface AddFeedInput {
  url: string;
  title: string;
}

export function useAddFeed(callbacks: UseAddFeedCallbacks) {
  return useMutation({
    mutationFn: async ({ url, title }: AddFeedInput) => {
      const feed = await fetchFeed(url);
      // Use the custom title if provided, otherwise keep the parsed feed title.
      return title ? { ...feed, title } : feed;
    },
    onSuccess: (feed) => {
      callbacks.onFeedAdded(feed);
    },
    onError: (e) => {
      callbacks.onFeedError(extractErrorMessage(e, "Something went wrong. Please try again."));
    },
  });
}
