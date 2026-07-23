import { describe, it, expect } from "vitest";
import { makeSubscription, sortByDate, flattenArticles } from "../src/lib/feedTransform";
import type { Feed, Article } from "../src/types";

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

describe("makeSubscription", () => {
  it("creates a FeedSubscription from a Feed with a stable UUID", () => {
    const feed = sampleFeed();
    const sub = makeSubscription(feed);
    expect(sub.id).not.toBe(feed.url);
    expect(sub.id).toMatch(/^[0-9a-f-]+$/);
    expect(sub.url).toBe(feed.url);
    expect(sub.title).toBe(feed.title);
    expect(sub.addedAt).toBeGreaterThan(0);
  });
});

describe("sortByDate", () => {
  it("sorts articles descending by publishedAt", () => {
    const articles = [
      { publishedAt: 3000 } as Article,
      { publishedAt: 1000 } as Article,
      { publishedAt: 2000 } as Article,
    ];
    const sorted = sortByDate(articles);
    expect(sorted.map((a) => a.publishedAt)).toEqual([3000, 2000, 1000]);
  });

  it("puts null publishedAt at the end", () => {
    const articles = [
      { publishedAt: 2000 } as Article,
      { publishedAt: null } as Article,
      { publishedAt: 1000 } as Article,
    ];
    const sorted = sortByDate(articles);
    expect(sorted.map((a) => a.publishedAt)).toEqual([2000, 1000, null]);
  });

  it("does not mutate the original array", () => {
    const articles = [
      { publishedAt: 2000 } as Article,
      { publishedAt: 1000 } as Article,
    ];
    const original = [...articles];
    sortByDate(articles);
    expect(articles).toEqual(original);
  });
});

describe("flattenArticles", () => {
  it("flattens and sorts articles from multiple feeds", () => {
    const feed1 = sampleFeed({
      articles: [
        { id: "a1", feedId: "f1", title: "A", link: "https://x.com/a", publishedAt: 3000 } as Article,
        { id: "a2", feedId: "f1", title: "B", link: "https://x.com/b", publishedAt: 1000 } as Article,
      ],
    });
    const feed2 = sampleFeed({
      articles: [
        { id: "a3", feedId: "f2", title: "C", link: "https://x.com/c", publishedAt: 2000 } as Article,
      ],
    });
    const flat = flattenArticles([feed1, feed2]);
    expect(flat.map((a) => a.publishedAt)).toEqual([3000, 2000, 1000]);
  });

  it("deduplicates articles with same link and title", () => {
    const feed1 = sampleFeed({
      articles: [
        { id: "a1", feedId: "f1", title: "Same", link: "https://x.com/dup", publishedAt: 3000 } as Article,
      ],
    });
    const feed2 = sampleFeed({
      articles: [
        { id: "a2", feedId: "f2", title: "Same", link: "https://x.com/dup", publishedAt: 2000 } as Article,
      ],
    });
    const flat = flattenArticles([feed1, feed2]);
    expect(flat).toHaveLength(1);
  });

  it("returns empty array for empty feeds", () => {
    expect(flattenArticles([])).toEqual([]);
  });
});