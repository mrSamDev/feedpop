import { jsonResponse, isValidFeedUrl } from "./handler";

const FEED_TIMEOUT_MS = 10000;
const CACHE_TTL_S = 900; // 15 min

/** Build a cache key from the request (normalized hostname for isolation). */
function buildCacheKey(request: Request): Request {
  const cacheUrl = new URL(request.url);
  cacheUrl.hostname = "feed-cache";
  return new Request(cacheUrl.toString(), {
    method: request.method,
    headers: request.headers,
  });
}

/** Read from Cloudflare Cache API. Returns null when cache is unavailable. */
async function readFeedCache(cacheKey: Request): Promise<Response | null> {
  try {
    const cache = (caches as unknown as { default: Cache } | undefined)?.default;
    if (!cache) return null;
    return (await cache.match(cacheKey)) ?? null;
  } catch {
    return null;
  }
}

/** Write to Cloudflare Cache API. No-op when cache is unavailable. */
async function writeFeedCache(cacheKey: Request, response: Response): Promise<void> {
  try {
    const cache = (caches as unknown as { default: Cache } | undefined)?.default;
    if (!cache) return;
    const cacheResponse = response.clone();
    const cacheHeaders = new Headers(cacheResponse.headers);
    cacheHeaders.set("Cache-Control", `public, s-maxage=${CACHE_TTL_S}`);
    await cache.put(cacheKey, new Response(cacheResponse.body, {
      status: cacheResponse.status,
      headers: cacheHeaders,
    }));
  } catch {
    // Cache not available
  }
}

/** Build conditional request headers from a cached response (ETag / Last-Modified). */
function buildConditionalHeaders(cached: Response | null): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "RSS-Feed-Reader/1.0",
  };
  if (!cached) return headers;
  const etag = cached.headers.get("ETag");
  const lastModified = cached.headers.get("Last-Modified");
  if (etag) headers["If-None-Match"] = etag;
  if (lastModified) headers["If-Modified-Since"] = lastModified;
  return headers;
}

/** Build a 304 Not Modified response from the cached body. */
function build304Response(cached: Response): Response {
  return new Response(cached.body, {
    status: 200,
    headers: {
      "Content-Type": cached.headers.get("Content-Type") ?? "application/xml",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "X-Cache": "HIT",
    },
  });
}

/** Build response headers from the origin response, forwarding ETag/Last-Modified. */
function buildFeedResponseHeaders(response: Response): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": response.headers.get("Content-Type") ?? "application/xml",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  const etag = response.headers.get("ETag");
  const lastModified = response.headers.get("Last-Modified");
  if (etag) headers["ETag"] = etag;
  if (lastModified) headers["Last-Modified"] = lastModified;
  return headers;
}

export async function handleFeedProxy(
  request: Request,
  fetchImpl: typeof fetch,
): Promise<Response> {
  const feedUrl = new URL(request.url).searchParams.get("url");
  if (!feedUrl) {
    return jsonResponse({ error: "Missing 'url' query parameter" }, 400);
  }

  if (!isValidFeedUrl(feedUrl)) {
    return jsonResponse({ error: "Only http and https URLs are allowed" }, 400);
  }

  // Try cache first (Cloudflare Workers Cache API)
  const cacheKey = buildCacheKey(request);
  const cachedResponse = await readFeedCache(cacheKey);

  // Build conditional headers from cached response
  const headers = buildConditionalHeaders(cachedResponse);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);

  try {
    const response = await fetchImpl(feedUrl, {
      signal: controller.signal,
      headers,
    });

    // 304 Not Modified — return cached body
    if (response.status === 304 && cachedResponse) {
      return build304Response(cachedResponse);
    }

    if (!response.ok) {
      return jsonResponse(
        { error: `Feed server returned ${response.status} ${response.statusText}` },
        502,
      );
    }

    const body = await response.text();
    const responseHeaders = buildFeedResponseHeaders(response);

    const finalResponse = new Response(body, {
      status: 200,
      headers: responseHeaders,
    });

    // Store in cache (no-op when cache is unavailable)
    await writeFeedCache(cacheKey, finalResponse);

    return finalResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return jsonResponse({ error: "Feed request timed out" }, 504);
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: `Failed to fetch feed: ${message}` }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
