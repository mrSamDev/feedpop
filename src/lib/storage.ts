import type { FeedSubscription } from "../types";

const STORAGE_KEY = "rss-feeds";

/** Migrate old subscriptions where id === url to use a stable UUID. */
function migrate(subscriptions: FeedSubscription[]): FeedSubscription[] {
  return subscriptions.map((s) => {
    if (s.id === s.url) {
      return { ...s, id: crypto.randomUUID() };
    }
    return s;
  });
}

export function loadFeeds(): FeedSubscription[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse stored feeds: ${message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Stored feeds are not a list");
  }
  return migrate(parsed as FeedSubscription[]);
}

export function saveFeeds(feeds: FeedSubscription[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(feeds));
}
