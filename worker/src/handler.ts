const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const FEED_TIMEOUT_MS = 10000;

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);

  try {
    const response = await fetchImpl(feedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "RSS-Feed-Reader/1.0" },
    });

    if (!response.ok) {
      return jsonResponse(
        { error: `Feed server returned ${response.status} ${response.statusText}` },
        502,
      );
    }

    const body = await response.text();
    return new Response(body, {
      status: 200,
      headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/xml", ...CORS_HEADERS },
    });
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