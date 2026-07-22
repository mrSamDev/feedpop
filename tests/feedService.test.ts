import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchFeed, FeedFetchError } from "../src/lib/feedService";;

const RSS_XML = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Test Feed</title><link>https://x.com</link><description>d</description>
  <item><title>Item 1</title><link>https://x.com/1</link><description>desc</description></item>
</channel></rss>`;

function mockOk(body: string): typeof fetch {
  return vi.fn(async () =>
    new Response(body, { status: 200, headers: { "Content-Type": "application/xml" } }),
  ) as unknown as typeof fetch;
}

function mockStatus(status: number, message: string): typeof fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  ) as unknown as typeof fetch;
}

beforeEach(() => {
  vi.stubEnv("VITE_PROXY_URL", "/api/feed");
});

describe("fetchFeed - success", () => {
  it("returns a parsed feed with articles", async () => {
    const feed = await fetchFeed("https://x.com/rss", mockOk(RSS_XML));
    expect(feed.title).toBe("Test Feed");
    expect(feed.articles).toHaveLength(1);
    expect(feed.articles[0].title).toBe("Item 1");
    expect(feed.url).toBe("https://x.com/rss");
  });

  it("sets lastFetchedAt to a recent timestamp", async () => {
    const before = Date.now();
    const feed = await fetchFeed("https://x.com/rss", mockOk(RSS_XML));
    expect(feed.lastFetchedAt).not.toBeNull();
    expect(feed.lastFetchedAt!).toBeGreaterThanOrEqual(before);
  });
});

describe("fetchFeed - proxy errors", () => {
  it("throws FeedFetchError on 502 with proxy message", async () => {
    await expect(
      fetchFeed("https://x.com/rss", mockStatus(502, "Failed to fetch feed: network down")),
    ).rejects.toThrow(FeedFetchError);
  });

  it("includes the proxy error message", async () => {
    await expect(
      fetchFeed("https://x.com/rss", mockStatus(502, "Failed to fetch feed: network down")),
    ).rejects.toThrow(/network down/);
  });

  it("throws on 400 invalid url", async () => {
    await expect(
      fetchFeed("javascript:alert(1)", mockStatus(400, "Only http and https URLs are allowed")),
    ).rejects.toThrow(/http and https/);
  });
});

describe("fetchFeed - network failure", () => {
  it("throws FeedFetchError when fetch rejects", async () => {
    const failFetch = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    await expect(fetchFeed("https://x.com/rss", failFetch)).rejects.toThrow(FeedFetchError);
  });
});

describe("fetchFeed - parse failure", () => {
  it("throws FeedFetchError when content is not valid XML", async () => {
    await expect(fetchFeed("https://x.com/rss", mockOk("not xml"))).rejects.toThrow(FeedFetchError);
  });
});