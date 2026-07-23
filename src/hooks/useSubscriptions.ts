import { useState } from "react";
import type { Feed, FeedSubscription } from "../types";
import { loadFeeds, saveFeeds } from "../lib/storage";

function makeSubscription(feed: Feed): FeedSubscription {
  return {
    id: crypto.randomUUID(),
    url: feed.url,
    title: feed.title,
    addedAt: Date.now(),
  };
}

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<FeedSubscription[]>(() => loadFeeds());

  function addSubscription(feed: Feed) {
    setSubscriptions((prev) => {
      if (prev.some((s) => s.url === feed.url)) return prev;
      const next = [...prev, makeSubscription(feed)];
      saveFeeds(next);
      return next;
    });
  }

  function removeSubscription(id: string) {
    setSubscriptions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveFeeds(next);
      return next;
    });
  }

  return { subscriptions, addSubscription, removeSubscription };
}
