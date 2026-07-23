import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSubscriptions } from "../src/hooks/useSubscriptions";
import type { Feed } from "../src/types";

beforeEach(() => localStorage.clear());

function sampleFeed(overrides?: Partial<Feed>): Feed {
  return {
    id: "https://x.com/rss",
    url: "https://x.com/rss",
    title: "Test Feed",
    description: "A test feed",
    link: "https://x.com",
    articles: [],
    lastFetchedAt: null,
    ...overrides,
  };
}

describe("useSubscriptions", () => {
  it("starts with empty subscriptions", () => {
    const { result } = renderHook(() => useSubscriptions());
    expect(result.current.subscriptions).toEqual([]);
  });

  it("adds a subscription from a feed", () => {
    const { result } = renderHook(() => useSubscriptions());
    const feed = sampleFeed();

    act(() => result.current.addSubscription(feed));

    expect(result.current.subscriptions).toHaveLength(1);
    expect(result.current.subscriptions[0].url).toBe(feed.url);
    expect(result.current.subscriptions[0].title).toBe(feed.title);
  });

  it("does not add duplicate subscriptions for the same URL", () => {
    const { result } = renderHook(() => useSubscriptions());
    const feed = sampleFeed();

    act(() => result.current.addSubscription(feed));
    act(() => result.current.addSubscription(feed));

    expect(result.current.subscriptions).toHaveLength(1);
  });

  it("removes a subscription by id", () => {
    const { result } = renderHook(() => useSubscriptions());
    const feed = sampleFeed();

    act(() => result.current.addSubscription(feed));
    const subId = result.current.subscriptions[0].id;
    act(() => result.current.removeSubscription(subId));

    expect(result.current.subscriptions).toHaveLength(0);
  });

  it("persists subscriptions to localStorage on add", () => {
    const { result } = renderHook(() => useSubscriptions());
    const feed = sampleFeed();

    act(() => result.current.addSubscription(feed));

    const stored = JSON.parse(localStorage.getItem("rss-feeds") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].url).toBe(feed.url);
  });

  it("persists removal to localStorage", () => {
    const { result } = renderHook(() => useSubscriptions());
    const feed = sampleFeed();

    act(() => result.current.addSubscription(feed));
    const subId = result.current.subscriptions[0].id;
    act(() => result.current.removeSubscription(subId));

    const stored = JSON.parse(localStorage.getItem("rss-feeds") ?? "[]");
    expect(stored).toHaveLength(0);
  });

  it("loads persisted subscriptions on mount", () => {
    const feed = sampleFeed();
    localStorage.setItem("rss-feeds", JSON.stringify([{ id: feed.url, url: feed.url, title: feed.title, addedAt: Date.now() }]));

    const { result } = renderHook(() => useSubscriptions());
    expect(result.current.subscriptions).toHaveLength(1);
    expect(result.current.subscriptions[0].url).toBe(feed.url);
  });

  it("migrates old subscriptions (id === url) to UUID on load", () => {
    const feed = sampleFeed();
    localStorage.setItem("rss-feeds", JSON.stringify([{ id: feed.url, url: feed.url, title: feed.title, addedAt: Date.now() }]));

    const { result } = renderHook(() => useSubscriptions());
    expect(result.current.subscriptions[0].id).not.toBe(feed.url);
    expect(result.current.subscriptions[0].id).toMatch(/^[0-9a-f-]+$/);
  });
});
