const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const FEED_TIMEOUT_MS = 10000;
const CACHE_TTL_S = 900; // 15 min

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function isValidFeedUrl(input: string): boolean {
  if (!input.trim()) return false;
  try {
    const parsed = new URL(input.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function handleRequest(
  request: Request,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const feedUrl = new URL(request.url).searchParams.get("url");
  if (!feedUrl) {
    return jsonResponse({ error: "Missing 'url' query parameter" }, 400);
  }

  if (!isValidFeedUrl(feedUrl)) {
    return jsonResponse({ error: "Only http and https URLs are allowed" }, 400);
  }

  // Try cache first (Cloudflare Workers Cache API)
  const cacheUrl = new URL(request.url);
  cacheUrl.hostname = "feed-cache";
  const cacheKey = new Request(cacheUrl.toString(), {
    method: request.method,
    headers: request.headers,
  });
  let cachedResponse: Response | null = null;
  try {
    const cache = (caches as unknown as { default: Cache } | undefined)?.default;
    if (cache) {
      cachedResponse = (await cache.match(cacheKey)) ?? null;
    }
  } catch {
    // Cache not available (e.g., test environment)
  }

  // Build conditional headers from cached response
  const headers: Record<string, string> = {
    "User-Agent": "RSS-Feed-Reader/1.0",
  };
  if (cachedResponse) {
    const etag = cachedResponse.headers.get("ETag");
    const lastModified = cachedResponse.headers.get("Last-Modified");
    if (etag) headers["If-None-Match"] = etag;
    if (lastModified) headers["If-Modified-Since"] = lastModified;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);

  try {
    const response = await fetchImpl(feedUrl, {
      signal: controller.signal,
      headers,
    });

    // 304 Not Modified — return cached body
    if (response.status === 304 && cachedResponse) {
      return new Response(cachedResponse.body, {
        status: 200,
        headers: {
          "Content-Type": cachedResponse.headers.get("Content-Type") ?? "application/xml",
          ...CORS_HEADERS,
          "X-Cache": "HIT",
        },
      });
    }

    if (!response.ok) {
      return jsonResponse(
        { error: `Feed server returned ${response.status} ${response.statusText}` },
        502,
      );
    }

    const body = await response.text();
    const responseHeaders: Record<string, string> = {
      "Content-Type": response.headers.get("Content-Type") ?? "application/xml",
      ...CORS_HEADERS,
    };

    // Forward ETag/Last-Modified for future conditional requests
    const originEtag = response.headers.get("ETag");
    const originLastModified = response.headers.get("Last-Modified");
    if (originEtag) responseHeaders["ETag"] = originEtag;
    if (originLastModified) responseHeaders["Last-Modified"] = originLastModified;

    const finalResponse = new Response(body, {
      status: 200,
      headers: responseHeaders,
    });

    // Store in cache
    try {
      const cache = (caches as unknown as { default: Cache } | undefined)?.default;
      if (cache) {
        const cacheResponse = finalResponse.clone();
        // Set Cache-Control so Cloudflare respects the TTL
        const cacheHeaders = new Headers(cacheResponse.headers);
        cacheHeaders.set("Cache-Control", `public, s-maxage=${CACHE_TTL_S}`);
        await cache.put(cacheKey, new Response(cacheResponse.body, {
          status: cacheResponse.status,
          headers: cacheHeaders,
        }));
      }
    } catch {
      // Cache not available
    }

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
