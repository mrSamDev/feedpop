import { describe, it, expect, vi } from "vitest";
import { handleRequest } from "../worker/src/handler";
import type { Env } from "../worker/src/index";

function makeRequest(url: string, method = "GET"): Request {
  return new Request(url, { method });
}

function mockEnv(): Env {
  return {
    SUMMARY_KV: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn().mockResolvedValue({ keys: [] }),
    } as unknown as KVNamespace,
    OPENAI_API_KEY: "test-key",
    AUTH_TOKEN: "test-token",
  };
}

function mockFetch(body: string, status = 200, contentType = "application/xml"): typeof fetch {
  return vi.fn(async () =>
    new Response(body, {
      status,
      headers: { "Content-Type": contentType },
    }),
  ) as unknown as typeof fetch;
}

describe("handleRequest - CORS preflight", () => {
  it("returns 204 with CORS headers for OPTIONS", async () => {
    const res = await handleRequest(makeRequest("https://proxy.dev/api/feed?url=x", "OPTIONS"), mockEnv());
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("handleRequest - validation", () => {
  it("rejects non-GET methods on feed paths", async () => {
    const res = await handleRequest(makeRequest("https://proxy.dev/api/feed?url=x", "POST"), mockEnv());
    expect(res.status).toBe(405);
  });

  it("rejects missing url param", async () => {
    const res = await handleRequest(makeRequest("https://proxy.dev/api/feed"), mockEnv());
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/url/i);
  });

  it("rejects non-http protocols", async () => {
    const res = await handleRequest(makeRequest("https://proxy.dev/api/feed?url=ftp://x.com/feed"), mockEnv());
    expect(res.status).toBe(400);
  });

  it("rejects javascript: URLs", async () => {
    const res = await handleRequest(makeRequest("https://proxy.dev/api/feed?url=javascript:alert(1)"), mockEnv());
    expect(res.status).toBe(400);
  });
});

describe("handleRequest - success", () => {
  it("fetches and returns the feed body with CORS headers", async () => {
    const fetchImpl = mockFetch("<rss>ok</rss>");
    const res = await handleRequest(
      makeRequest("https://proxy.dev/api/feed?url=https://hnrss.org/frontpage"),
      mockEnv(),
      fetchImpl,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(await res.text()).toBe("<rss>ok</rss>");
  });
});

describe("handleRequest - errors", () => {
  it("returns 502 when feed server errors", async () => {
    const fetchImpl = mockFetch("Internal Server Error", 500);
    const res = await handleRequest(
      makeRequest("https://proxy.dev/api/feed?url=https://x.com/feed"),
      mockEnv(),
      fetchImpl,
    );
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/500/);
  });

  it("returns 502 when fetch throws", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    const res = await handleRequest(
      makeRequest("https://proxy.dev/api/feed?url=https://x.com/feed"),
      mockEnv(),
      fetchImpl,
    );
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/network down/);
  });
});
