import type { Env } from "./index";
import { handleFeedProxy } from "./feedProxy";
import { generateSummary, getCachedSummary } from "./summary";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export function isValidFeedUrl(input: string): boolean {
  if (!input.trim()) return false;
  try {
    const parsed = new URL(input.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isAuthorized(request: Request, env: Env): boolean {
  const auth = request.headers.get("Authorization");
  if (!auth || !env.AUTH_TOKEN) return false;
  return auth === `Bearer ${env.AUTH_TOKEN}`;
}

async function handlePostSummary(
  request: Request,
  env: Env,
  fetchImpl: typeof fetch,
): Promise<Response> {
  if (!isAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let body: { feeds?: string[] };
  try {
    body = (await request.json()) as { feeds?: string[] };
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!body.feeds || !Array.isArray(body.feeds) || body.feeds.length === 0) {
    return jsonResponse({ error: "Missing or empty 'feeds' array" }, 400);
  }

  try {
    const result = await generateSummary(body.feeds, env.OPENAI_API_KEY, env.SUMMARY_KV, fetchImpl);
    return jsonResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: `Failed to generate summary: ${message}` }, 502);
  }
}

async function handleGetSummary(
  _request: Request,
  env: Env,
): Promise<Response> {
  const result = await getCachedSummary(env.SUMMARY_KV);
  if (!result) {
    return jsonResponse({ error: "No summary for today" }, 404);
  }
  return jsonResponse(result);
}

export async function handleRequest(
  request: Request,
  env: Env,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");

  // Route: POST /api/summary — generate daily summary
  if (request.method === "POST" && path === "/api/summary") {
    return handlePostSummary(request, env, fetchImpl);
  }

  // Route: GET /api/summary — get cached daily summary
  if (request.method === "GET" && path === "/api/summary") {
    return handleGetSummary(request, env);
  }

  // Route: GET /api/feed or root — proxy feed URL (backward compat)
  if (request.method === "GET" && (path === "/api/feed" || path === "")) {
    return handleFeedProxy(request, fetchImpl);
  }

  // Known path with unsupported method
  if (path === "/api/feed" || path === "" || path === "/api/summary") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  return jsonResponse({ error: "Not found" }, 404);
}
