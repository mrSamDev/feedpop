import type { Feed, Article, FeedSubscription } from "../types";
import { FeedFetchError } from "../api/feedApi";

export function makeSubscription(feed: Feed): FeedSubscription {
  return {
    id: crypto.randomUUID(),
    url: feed.url,
    title: feed.title,
    addedAt: Date.now(),
  };
}

/** Remap a fetched feed's IDs to use the subscription's stable UUID. */
export function remapFeed(feed: Feed, subId: string): Feed {
  return {
    ...feed,
    id: subId,
    articles: feed.articles.map((a) => ({
      ...a,
      feedId: subId,
    })),
  };
}

export function extractErrorMessage(e: unknown, fallback: string): string {
  return e instanceof FeedFetchError ? e.message : fallback;
}

export function sortByDate(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
}

/** Dedupe by link+title hash, keep first occurrence (most recent after sort). */
function dedupeArticles(articles: Article[]): Article[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    // Only dedupe when we have both link and title
    if (!a.link && !a.title) return true;
    const key = `${a.link}::${a.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function flattenArticles(feeds: Feed[]): Article[] {
  return dedupeArticles(sortByDate(feeds.flatMap((f) => f.articles)));
}
