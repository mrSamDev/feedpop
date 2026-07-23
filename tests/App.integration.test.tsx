import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
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
    <author>author@example.com (Author A)</author>
    <pubDate>${new Date(Date.now() - 3600_000).toUTCString()}</pubDate>
    <guid>https://x.com/1</guid>
  </item>
</channel></rss>`;

function mockFetchOk(xml: string) {
  return vi.fn(async () =>
    new Response(xml, { status: 200, headers: { "Content-Type": "application/xml" } }),
  ) as unknown as typeof fetch;
}

function mockFetchError(message: string, status = 502) {
  return vi.fn(async () =>
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
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

describe("App - add feed flow", () => {
  it("adds a feed and shows its articles as cards", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", mockFetchOk(RSS_XML));

    renderWithQuery(<App />);
    await user.type(screen.getByPlaceholderText(/paste an rss/i), "https://x.com/rss");
    await user.click(screen.getByRole("button", { name: /add feed/i }));

    await waitFor(() => expect(screen.getByText("First Article")).toBeInTheDocument());
    expect(screen.getByText("Mock Feed")).toBeInTheDocument();
    // Card itself is clickable (role="button") — no separate "Open article" button
    expect(screen.getByRole("button", { name: /first article/i })).toBeInTheDocument();
  });

  it("shows an error when adding a bad feed", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", mockFetchError("Failed to fetch feed: network down"));

    renderWithQuery(<App />);
    await user.type(screen.getByPlaceholderText(/paste an rss/i), "https://bad.com/rss");
    await user.click(screen.getByRole("button", { name: /add feed/i }));

    await waitFor(() => expect(screen.getByText(/network down/i)).toBeInTheDocument());
  });

  it("hides the feed-load error when the dismiss button is clicked", async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/summary")) {
        return new Response(null, { status: 404 });
      }
      return new Response(JSON.stringify({ error: "Failed to fetch feed: network down" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }) as Mock;
    vi.stubGlobal("fetch", fetchMock);

    // Pre-seed a subscription so useFeeds tries to fetch and fails (feedError, not addError)
    localStorage.setItem(
      "rss-feeds",
      JSON.stringify([
        { id: "sub-1", url: "https://x.com/rss", title: "Mock Feed", addedAt: Date.now() },
      ]),
    );

    renderWithQuery(<App />);

    await waitFor(() => expect(screen.getByText(/network down/i)).toBeInTheDocument(), {
      timeout: 5000,
    });

    const callsBeforeDismiss = fetchMock.mock.calls.length;

    // The ✕ button labeled "Dismiss" should hide the error without refetching
    await user.click(screen.getByRole("button", { name: /^dismiss$/i }));

    await waitFor(() => {
      expect(screen.queryByText(/network down/i)).not.toBeInTheDocument();
    });

    // Dismiss must not trigger a refetch (that's what the Retry button does)
    expect(fetchMock.mock.calls.length).toBe(callsBeforeDismiss);
  });
});

describe("App - remove feed flow", () => {
  it("removes a feed from the sources bar", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", mockFetchOk(RSS_XML));

    renderWithQuery(<App />);
    await user.type(screen.getByPlaceholderText(/paste an rss/i), "https://x.com/rss");
    await user.click(screen.getByRole("button", { name: /add feed/i }));

    await waitFor(() => expect(screen.getByText("First Article")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /remove mock feed/i }));

    await waitFor(() => {
      expect(screen.queryByText("First Article")).not.toBeInTheDocument();
    });
  });
});

describe("App - article modal", () => {
  it("opens an article in the modal when 'Open article' is clicked", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", mockFetchOk(RSS_XML));

    renderWithQuery(<App />);
    await user.type(screen.getByPlaceholderText(/paste an rss/i), "https://x.com/rss");
    await user.click(screen.getByRole("button", { name: /add feed/i }));

    await waitFor(() => expect(screen.getByText("First Article")).toBeInTheDocument());
    // Click the article card itself (it has role="button") to open the modal
    await user.click(screen.getByRole("button", { name: /first article/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /close article/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /read original/i })).toHaveAttribute("href", "https://x.com/1");
  });
});