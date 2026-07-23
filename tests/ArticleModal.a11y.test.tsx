import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
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
  imageUrl: null,
  author: "Jane Doe",
  publishedAt: Date.parse("2025-07-21T10:00:00Z"),
};

describe("ArticleModal — accessibility", () => {
  it("has role=dialog and aria-modal=true", () => {
    render(<ArticleModal article={article} onClose={() => {}} />);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("labels the dialog with the article title via aria-labelledby", () => {
    render(<ArticleModal article={article} onClose={() => {}} />);
    const dialog = screen.getByRole("dialog");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    const labelEl = document.getElementById(labelledBy!);
    expect(labelEl?.textContent).toBe("Test Article");
  });

  it("moves focus to the close button on open", () => {
    render(<ArticleModal article={article} onClose={() => {}} />);
    expect(screen.getByRole("button", { name: /close article/i })).toHaveFocus();
  });

  it("traps Tab focus within the dialog", async () => {
    const user = userEvent.setup();
    render(<ArticleModal article={article} onClose={() => {}} />);

    // Close button is the first (and only) focusable element besides the link.
    // Tab from the link should wrap back to the close button.
    const closeBtn = screen.getByRole("button", { name: /close article/i });
    const link = screen.getByRole("link", { name: /read original/i });

    await user.tab(); // close button → link
    expect(link).toHaveFocus();

    await user.tab(); // link → wraps to close button
    expect(closeBtn).toHaveFocus();

    // Shift+Tab from close button → wraps to link
    await user.tab({ shift: true });
    expect(link).toHaveFocus();
  });

  it("indicates the Read original link opens a new tab", () => {
    render(<ArticleModal article={article} onClose={() => {}} />);
    const link = screen.getByRole("link", { name: /read original.*new tab/i });
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("restores focus to the triggering element on close", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Open article";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(trigger).toHaveFocus();

    const onClose = vi.fn();
    const { unmount } = render(<ArticleModal article={article} onClose={onClose} />);

    // Focus should be inside the modal
    expect(screen.getByRole("button", { name: /close article/i })).toHaveFocus();

    // Unmount the modal (simulates close) — cleanup restores focus.
    // Wrap in act to flush any pending effects synchronously.
    await act(async () => { unmount(); });

    // Focus should return to the trigger (jsdom may land on body first)
    await waitFor(() => expect(trigger).toHaveFocus());

    document.body.removeChild(trigger);
  });
});