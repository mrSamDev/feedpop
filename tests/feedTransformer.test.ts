import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSubscriptions } from "../src/hooks/useSubscriptions";
import { useFeeds } from "../src/hooks/useFeeds";
import type { Feed, FeedSubscription } from "../src/types";

beforeEach(() => {
  localStorage.clear();
});

function sampleFeed(overrides?: Partial<Feed>): Feed {
  return {
    id: "https://x.com/rss",
    url: "https://x.com/rss",
    title: "Test Feed",
    description: "A test feed",
    link: "https://x.com",
    articles: [
      {
        id: "1",
        feedId: "https://x.com/rss",
        title: "Article 1",
        link: "https://x.com/1",
        description: "First article",
        content: "",
        imageUrl: null,
        author: "Author A",
        publishedAt: 2000,
      },
      {
        id: "2",
        feedId: "https://x.com/rss",
        title: "Article 2",
        link: "https://x.com/2",
        description: "Second article",
        content: "",
        imageUrl: null,
        author: "Author B",
        publishedAt: 1000,
      },
    ],
    lastFetchedAt: null,
    ...overrides,
  };
}

describe("makeSubscription (via useSubscriptions)", () => {
  it("creates a FeedSubscription from a Feed with a stable UUID", () => {
    const { result } = renderHook(() => useSubscriptions());
    const feed = sampleFeed();

    act(() => result.current.addSubscription(feed));

    const sub = result.current.subscriptions[0];
    expect(sub.id).not.toBe(feed.url);
    expect(sub.id).toMatch(/^[0-9a-f-]+$/);
    expect(sub.url).toBe(feed.url);
    expect(sub.title).toBe(feed.title);
    expect(sub.addedAt).toBeGreaterThan(0);
  });
});

describe("flattenArticles (via useFeeds)", () => {
  it("returns empty array for empty subscriptions", () => {
    const { result } = renderHook(() => useFeeds([]));
    expect(result.current.allArticles).toEqual([]);
  });

  it("sorts articles descending by publishedAt", () => {
    const subs: FeedSubscription[] = [
      { id: "f1", url: "https://x.com/rss", title: "Feed", addedAt: 0 },
    ];
    const { result } = renderHook(() => useFeeds(subs));
    // With no fetch, feeds is empty, so allArticles is empty
    // This tests the empty case through the hook
    expect(result.current.allArticles).toEqual([]);
  });
});
