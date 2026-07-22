import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArticleModal } from "../src/components/ArticleModal";
import type { Article } from "../src/types";

const article: Article = {
  id: "art-1",
  feedId: "https://x.com/rss",
  title: "Test Article",
  link: "https://x.com/1",
  description: "Summary",
  content: "<p>The full article content.</p>",
  author: "Jane Doe",
  publishedAt: Date.parse("2025-07-21T10:00:00Z"),
};

describe("ArticleModal", () => {
  it("renders the article title and content", () => {
    render(<ArticleModal article={article} onClose={() => {}} />);
    expect(screen.getByText("Test Article")).toBeInTheDocument();
    expect(screen.getByText(/full article content/i)).toBeInTheDocument();
  });

  it("shows a link to the original article", () => {
    render(<ArticleModal article={article} onClose={() => {}} />);
    expect(screen.getByRole("link", { name: /read original/i })).toHaveAttribute("href", "https://x.com/1");
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ArticleModal article={article} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the Escape key is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ArticleModal article={article} onClose={onClose} />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders content as HTML", () => {
    const htmlArticle = { ...article, content: "<strong>Bold text</strong>" };
    render(<ArticleModal article={htmlArticle} onClose={() => {}} />);
    expect(screen.getByText("Bold text").tagName).toBe("STRONG");
  });
});