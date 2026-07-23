import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddFeed } from "../src/components/AddFeed";

describe("AddFeed — accessibility", () => {
  it("has labels associated with inputs", () => {
    render(<AddFeed isAdding={false} onAdd={() => {}} />);
    expect(screen.getByLabelText(/add feed url/i)).toHaveAttribute("id", "feed-url-input");
    expect(screen.getByLabelText(/custom feed title/i)).toHaveAttribute("id", "feed-title-input");
  });

  it("shows a validation error for invalid URLs with role=alert", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<AddFeed isAdding={false} onAdd={onAdd} />);

    // "http://" has no hostname — new URL() throws, so isValidFeedUrl returns false.
    await user.type(screen.getByLabelText(/add feed url/i), "http://");
    await user.click(screen.getByRole("button", { name: /add feed/i }));

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).toMatch(/valid rss or atom feed url/i);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("marks the URL input as aria-invalid when validation fails", async () => {
    const user = userEvent.setup();
    render(<AddFeed isAdding={false} onAdd={() => {}} />);

    const urlInput = screen.getByLabelText(/add feed url/i);
    expect(urlInput).not.toHaveAttribute("aria-invalid", "true");

    await user.type(urlInput, "http://");
    await user.click(screen.getByRole("button", { name: /add feed/i }));

    expect(urlInput).toHaveAttribute("aria-invalid", "true");
  });

  it("clears the error when the user types again", async () => {
    const user = userEvent.setup();
    render(<AddFeed isAdding={false} onAdd={() => {}} />);

    const urlInput = screen.getByLabelText(/add feed url/i);
    await user.type(urlInput, "http://");
    await user.click(screen.getByRole("button", { name: /add feed/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.type(urlInput, "x");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(urlInput).not.toHaveAttribute("aria-invalid", "true");
  });
});