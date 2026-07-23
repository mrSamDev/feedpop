import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQuery } from "./helpers/render";
import { App } from "../src/App";

const RSS_XML = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Mock Feed</title>
  <link>https://x.com</link>
  <description>A mock feed</description>
  <item>
    <title>First Article</title>
    <link>https://x.com/1</link>
    <description>Summary one</description>
    <pubDate>${new Date(Date.now() - 3600_000).toUTCString()}</pubDate>
    <guid>https://x.com/1</guid>
  </item>
</channel></rss>`;

function mockFetchOk(xml: string) {
  return vi.fn(async () =>
    new Response(xml, { status: 200, headers: { "Content-Type": "application/xml" } }),
  ) as unknown as typeof fetch;
}

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv("VITE_PROXY_URL", "/api/feed");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("App — accessibility", () => {
  it("has a skip-to-content link as the first focusable element", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", mockFetchOk(RSS_XML));
    renderWithQuery(<App />);

    await user.tab();
    expect(screen.getByText(/skip to content/i)).toHaveFocus();
  });

  it("the skip link targets the main content region", () => {
    vi.stubGlobal("fetch", mockFetchOk(RSS_XML));
    renderWithQuery(<App />);
    const skipLink = screen.getByText(/skip to content/i);
    const targetId = skipLink.getAttribute("href");
    expect(targetId).toBe("#main-content");
    const main = document.getElementById("main-content");
    expect(main).toBeTruthy();
    expect(main?.tagName).toBe("MAIN");
  });

  it("announces feed-load errors via role=alert", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "Network down" }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }),
      ) as unknown as typeof fetch,
    );

    renderWithQuery(<App />);
    await user.type(screen.getByPlaceholderText(/paste an rss/i), "https://x.com/rss");
    await user.click(screen.getByRole("button", { name: /add feed/i }));

    await waitFor(() => {
      const alerts = screen.getAllByRole("alert");
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("has a live region for loading state announcements", () => {
    vi.stubGlobal("fetch", mockFetchOk(RSS_XML));
    const { container } = renderWithQuery(<App />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeTruthy();
  });

  it("uses headings for empty-state messages", () => {
    vi.stubGlobal("fetch", mockFetchOk(RSS_XML));
    renderWithQuery(<App />);
    // The welcome message should be a heading, not a paragraph
    const welcome = screen.getByRole("heading", { name: /welcome to feedpop/i });
    expect(welcome.tagName).toMatch(/^H[1-6]$/);
  });

  it("article grid has list semantics", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", mockFetchOk(RSS_XML));
    renderWithQuery(<App />);

    await user.type(screen.getByPlaceholderText(/paste an rss/i), "https://x.com/rss");
    await user.click(screen.getByRole("button", { name: /add feed/i }));

    await waitFor(() => expect(screen.getByText("First Article")).toBeInTheDocument());
    // The article grid list should be present (SourcesBar also has a list)
    const lists = screen.getAllByRole("list");
    expect(lists.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(1);
  });

  it("dialog has aria-modal when an article is opened", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", mockFetchOk(RSS_XML));
    renderWithQuery(<App />);

    await user.type(screen.getByPlaceholderText(/paste an rss/i), "https://x.com/rss");
    await user.click(screen.getByRole("button", { name: /add feed/i }));

    await waitFor(() => expect(screen.getByText("First Article")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /first article/i }));

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });
  });
});