import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useReadArticles } from "../src/hooks/useReadArticles";
import { useTheme } from "../src/hooks/useTheme";

beforeEach(() => localStorage.clear());

function mockMatchMedia(matches: boolean) {
  window.matchMedia = (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

describe("useTheme - system preference", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to dark when system prefers dark and nothing is stored", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("defaults to light when system prefers light and nothing is stored", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  it("uses stored preference over system preference", () => {
    localStorage.setItem("feedpop-theme", "light");
    mockMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });
});

describe("useReadArticles", () => {
  it("starts with empty read set", () => {
    const { result } = renderHook(() => useReadArticles());
    expect(result.current.readIds.size).toBe(0);
  });

  it("marks an article as read", () => {
    const { result } = renderHook(() => useReadArticles());
    act(() => result.current.markRead("article-1"));
    expect(result.current.readIds.has("article-1")).toBe(true);
  });

  it("persists read ids to localStorage after mark", async () => {
    const { result } = renderHook(() => useReadArticles());
    act(() => result.current.markRead("article-1"));
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("feedpop-read") ?? "[]");
      expect(stored).toContain("article-1");
    });
  });

  it("does not duplicate an already-read id", () => {
    const { result } = renderHook(() => useReadArticles());
    act(() => result.current.markRead("article-1"));
    act(() => result.current.markRead("article-1"));
    expect(result.current.readIds.size).toBe(1);
  });

  it("loads persisted read ids on mount", () => {
    localStorage.setItem("feedpop-read", JSON.stringify(["article-1", "article-2"]));
    const { result } = renderHook(() => useReadArticles());
    expect(result.current.readIds.has("article-1")).toBe(true);
    expect(result.current.readIds.has("article-2")).toBe(true);
  });

  it("computes unread count from current article ids", () => {
    const { result } = renderHook(() => useReadArticles());
    act(() => result.current.markRead("a1"));
    act(() => result.current.markRead("a2"));
    // 5 current articles, 2 read → 3 unread
    expect(result.current.unreadCount(["a1", "a2", "a3", "a4", "a5"])).toBe(3);
  });

  it("never returns negative when readIds contains stale ids", () => {
    // Simulate persisted read ids from articles no longer loaded
    localStorage.setItem("feedpop-read", JSON.stringify(["old-1", "old-2", "old-3", "old-4", "old-5"]));
    const { result } = renderHook(() => useReadArticles());
    // Only 3 current articles, but 5 stale read ids — must not go negative
    expect(result.current.unreadCount(["a1", "a2", "a3"])).toBe(3);
  });

  it("logs an error and starts empty when stored data is corrupt JSON", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("feedpop-read", "not-json");
    const { result } = renderHook(() => useReadArticles());
    expect(result.current.readIds.size).toBe(0);
    expect(consoleSpy).toHaveBeenCalledOnce();
    consoleSpy.mockRestore();
  });
});
