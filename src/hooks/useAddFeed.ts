import { useMutation } from "@tanstack/react-query";
import { fetchFeed } from "../api/feedApi";
import { extractErrorMessage } from "../transformers/feedTransformer";
import type { Feed } from "../types";

interface UseAddFeedCallbacks {
  onFeedAdded: (feed: Feed) => void;
  onFeedError: (message: string) => void;
}

export function useAddFeed(callbacks: UseAddFeedCallbacks) {
  return useMutation({
    mutationFn: (url: string) => fetchFeed(url),
    onSuccess: (feed) => {
      callbacks.onFeedAdded(feed);
    },
    onError: (e) => {
      callbacks.onFeedError(extractErrorMessage(e, "Something went wrong. Please try again."));
    },
  });
}
