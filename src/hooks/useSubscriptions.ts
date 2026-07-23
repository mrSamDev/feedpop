import { useState, useEffect } from "react";
import type { Feed, FeedSubscription } from "../types";
import { loadFeeds, saveFeeds } from "../lib/storage";
import { makeSubscription } from "../lib/feedTransform";

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<FeedSubscription[]>(() => loadFeeds());

  // Persist to localStorage whenever subscriptions change
  useEffect(() => {
    saveFeeds(subscriptions);
  }, [subscriptions]);

  function addSubscription(feed: Feed) {
    setSubscriptions((prev) =>
      prev.some((s) => s.url === feed.url) ? prev : [...prev, makeSubscription(feed)],
    );
  }

  function removeSubscription(id: string) {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  }

  return { subscriptions, addSubscription, removeSubscription };
}