import type { FeedSubscription } from "./types";

const STORAGE_KEY = "rss-feeds";

export function loadFeeds(): FeedSubscription[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as FeedSubscription[];
  } catch {
    return [];
  }
}

export function saveFeeds(feeds: FeedSubscription[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(feeds));
}