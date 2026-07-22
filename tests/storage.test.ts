import { describe, it, expect, beforeEach } from "vitest";
import { loadFeeds, saveFeeds } from "../src/storage";
import type { FeedSubscription } from "../src/types";

function makeFeed(url: string, title: string): FeedSubscription {
  return { id: url, url, title, addedAt: Date.now() };
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

  it("returns empty array when stored data is corrupt", () => {
    localStorage.setItem("rss-feeds", "not json");
    expect(loadFeeds()).toEqual([]);
  });
});

describe("saveFeeds", () => {
  it("persists feeds to localStorage", () => {
    const feeds = [makeFeed("https://a.com/rss", "Feed A")];
    saveFeeds(feeds);
    expect(JSON.parse(localStorage.getItem("rss-feeds")!)).toHaveLength(1);
  });
});