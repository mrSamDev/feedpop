import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArticleCard } from "../src/components/ArticleCard";
import type { Article } from "../src/types";

const baseArticle: Article = {
  id: "art-1",
  feedId: "https://x.com/rss",
  title: "Test Article Title",
  link: "https://x.com/1",
  description: "A short summary.",
  content: "<p>Content here.</p>",
  imageUrl: null,
  author: "Jane Doe",
  publishedAt: Date.now() - 3600_000, // 1h ago — fresh
};

describe("ArticleCard — accessibility", () => {
  it("uses the heading as the button's accessible name (no duplicate aria-label)", () => {
    render(<ArticleCard article={baseArticle} onOpen={() => {}} isRead={false} />);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-labelledby")).toBeTruthy();
    expect(btn.getAttribute("aria-label")).toBeNull();
  });

  it("exposes unread status via aria-description", () => {
    render(<ArticleCard article={baseArticle} onOpen={() => {}} isRead={false} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-description", expect.stringContaining("unread"));
  });

  it("exposes read status via aria-description", () => {
    render(<ArticleCard article={baseArticle} onOpen={() => {}} isRead={true} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-description", expect.stringContaining("read"));
  });

  it("exposes fresh status when the article is under 24h old", () => {
    render(<ArticleCard article={baseArticle} onOpen={() => {}} isRead={false} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-description", expect.stringContaining("fresh"));
    expect(screen.getByRole("img", { name: /fresh post/i })).toBeInTheDocument();
  });

  it("does not label as fresh when older than 24h", () => {
    const oldArticle = { ...baseArticle, publishedAt: Date.now() - 48 * 3600_000 };
    render(<ArticleCard article={oldArticle} onOpen={() => {}} isRead={false} />);
    expect(screen.getByRole("button").getAttribute("aria-description")).not.toMatch(/fresh/);
    expect(screen.queryByRole("img", { name: /fresh post/i })).not.toBeInTheDocument();
  });

  it("opens the article on Enter and Space", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<ArticleCard article={baseArticle} onOpen={onOpen} isRead={false} />);

    const card = screen.getByRole("button");
    card.focus();
    await user.keyboard("{Enter}");
    expect(onOpen).toHaveBeenCalledTimes(1);

    card.focus();
    await user.keyboard(" "); // Space
    expect(onOpen).toHaveBeenCalledTimes(2);
  });
});