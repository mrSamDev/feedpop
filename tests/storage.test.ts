import { describe, it, expect, beforeEach } from "vitest";
import { loadFeeds, saveFeeds } from "../src/lib/storage";
import type { FeedSubscription } from "../src/types";

function makeFeed(url: string, title: string): FeedSubscription {
  return { id: crypto.randomUUID(), url, title, addedAt: Date.now() };
}

beforeEach(() => {
  localStorage.clear();
});

describe("loadFeeds", () => {
  it("returns empty array when nothing stored", () => {
    expect(loadFeeds()).toEqual([]);
  });

  it("returns stored feeds", () => {
    const feeds = [makeFeed("https://a.com/rss", "Feed A")];
    localStorage.setItem("rss-feeds", JSON.stringify(feeds));
    expect(loadFeeds()).toHaveLength(1);
    expect(loadFeeds()[0].title).toBe("Feed A");
  });

  it("migrates old subscriptions (id === url) to UUID", () => {
    localStorage.setItem("rss-feeds", JSON.stringify([{ id: "https://a.com/rss", url: "https://a.com/rss", title: "Feed A", addedAt: Date.now() }]));
    const feeds = loadFeeds();
    expect(feeds[0].id).not.toBe("https://a.com/rss");
    expect(feeds[0].id).toMatch(/^[0-9a-f-]+$/);
  });

  it("throws when stored data is corrupt JSON", () => {
    localStorage.setItem("rss-feeds", "not json");
    expect(() => loadFeeds()).toThrow();
  });

  it("throws when stored data is not an array", () => {
    localStorage.setItem("rss-feeds", JSON.stringify({ foo: 1 }));
    expect(() => loadFeeds()).toThrow();
  });
});

describe("saveFeeds", () => {
  it("persists feeds to localStorage", () => {
    const feeds = [makeFeed("https://a.com/rss", "Feed A")];
    saveFeeds(feeds);
    expect(JSON.parse(localStorage.getItem("rss-feeds")!)).toHaveLength(1);
  });
});
