import { useState, useEffect, useCallback } from "react";
import type { Feed, FeedSubscription } from "../types";
import { loadFeeds, saveFeeds } from "../lib/storage";
import { makeSubscription } from "../transformers/feedTransformer";

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<FeedSubscription[]>(() => loadFeeds());

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

  const syncTitles = useCallback((feeds: Feed[]) => {
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
  }, []);

  return { subscriptions, addSubscription, removeSubscription, syncTitles };
}
