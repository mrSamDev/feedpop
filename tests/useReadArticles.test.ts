import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useReadArticles } from "../src/hooks/useReadArticles";

beforeEach(() => localStorage.clear());

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

  it("computes unread count correctly", () => {
    const { result } = renderHook(() => useReadArticles());
    act(() => result.current.markRead("a1"));
    act(() => result.current.markRead("a2"));
    expect(result.current.unreadCount(5)).toBe(3);
  });
});
