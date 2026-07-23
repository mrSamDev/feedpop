import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArticleGrid } from "../src/components/ArticleGrid";
import type { Article } from "../src/types";

function makeArticles(count: number, prefix: string): Article[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    feedId: "feed-1",
    title: `${prefix} Article ${i}`,
    link: `https://x.com/${prefix}/${i}`,
    description: "desc",
    content: "",
    imageUrl: null,
    author: "",
    publishedAt: 1000 - i,
  }));
}

describe("ArticleGrid - pagination reset", () => {
  it("resets visible count when the key changes even if length is the same", async () => {
    const user = userEvent.setup();
    const articlesA = makeArticles(35, "feedA");
    const { rerender } = render(
      <ArticleGrid key="feedA" articles={articlesA} onOpen={() => {}} readIds={new Set()} />,
    );

    // Load more to expand beyond PAGE_SIZE (30)
    await user.click(screen.getByRole("button", { name: /load more/i }));
    expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();

    // Re-render with a different key — React unmounts and remounts, resetting state
    const articlesB = makeArticles(35, "feedB");
    rerender(
      <ArticleGrid key="feedB" articles={articlesB} onOpen={() => {}} readIds={new Set()} />,
    );

    // visibleCount should have reset to PAGE_SIZE — "Load more" should reappear
    expect(screen.getByRole("button", { name: /load more/i })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(30);
  });
});