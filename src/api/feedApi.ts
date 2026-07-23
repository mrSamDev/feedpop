import type { Feed } from "../types";
import { parseFeed } from "../lib/feedParser";

export class FeedFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedFetchError";
  }
}

export function extractErrorMessage(e: unknown, fallback: string): string {
  return e instanceof FeedFetchError ? e.message : fallback;
}

function proxyUrl(): string {
  return import.meta.env.VITE_PROXY_URL ?? "/api/feed";
}

function buildRequest(feedUrl: string): string {
  return `${proxyUrl()}?url=${encodeURIComponent(feedUrl)}`;
}

export async function fetchFeed(
  feedUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Feed> {
  let response: Response;
  try {
    response = await fetchImpl(buildRequest(feedUrl));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed";
    throw new FeedFetchError(`Could not reach the feed server: ${message}`);
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // response had no JSON body — keep the default message
    }
    throw new FeedFetchError(message);
  }

  const xml = await response.text();

  let feed: Feed;
  try {
    feed = await parseFeed(xml, feedUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not parse the feed";
    throw new FeedFetchError(`This doesn't look like a valid RSS or Atom feed: ${message}`);
  }

  return { ...feed, lastFetchedAt: Date.now() };
}
