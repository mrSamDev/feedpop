import { describe, it, expect, vi } from "vitest";
import { handleRequest } from "../worker/src/handler";
import { generateSummary } from "../worker/src/summary";
import type { Env } from "../worker/src/index";

function makeRequest(url: string, method = "GET"): Request {
  return new Request(url, { method });
}

function mockEnv(overrides?: Partial<Env>): Env {
  return {
    SUMMARY_KV: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn().mockResolvedValue({ keys: [] }),
    } as unknown as KVNamespace,
    OPENAI_API_KEY: "sk-test",
    AUTH_TOKEN: "test-token",
    ...overrides,
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
  it("rejects non-GET methods on feed proxy", async () => {
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

describe("handleRequest - summary endpoints", () => {
  it("returns 401 on POST /api/summary without auth", async () => {
    const res = await handleRequest(
      new Request("https://proxy.dev/api/summary", { method: "POST", body: JSON.stringify({ feeds: [] }), headers: { "Content-Type": "application/json" } }),
      mockEnv(),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 on POST /api/summary with empty feeds", async () => {
    const res = await handleRequest(
      new Request("https://proxy.dev/api/summary", {
        method: "POST",
        body: JSON.stringify({ feeds: [] }),
        headers: { "Content-Type": "application/json", Authorization: "Bearer test-token" },
      }),
      mockEnv(),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/feeds/i);
  });

  it("returns 404 on GET /api/summary when no cached summary", async () => {
    const kv = { get: vi.fn().mockResolvedValue(null) } as unknown as KVNamespace;
    const res = await handleRequest(
      new Request("https://proxy.dev/api/summary"),
      mockEnv({ SUMMARY_KV: kv }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 on unknown path", async () => {
    const res = await handleRequest(new Request("https://proxy.dev/api/unknown"), mockEnv());
    expect(res.status).toBe(404);
  });

  it("normalizes trailing slash on /api/feed/", async () => {
    const fetchImpl = mockFetch("<rss>ok</rss>");
    const res = await handleRequest(
      new Request("https://proxy.dev/api/feed/?url=https://hnrss.org/frontpage"),
      mockEnv(),
      fetchImpl,
    );
    expect(res.status).toBe(200);
  });

  it("normalizes trailing slash on /api/summary/", async () => {
    const kv = { get: vi.fn().mockResolvedValue(null) } as unknown as KVNamespace;
    const res = await handleRequest(
      new Request("https://proxy.dev/api/summary/"),
      mockEnv({ SUMMARY_KV: kv }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 200 on GET /api/summary when cached summary exists", async () => {
    const cached = JSON.stringify({ date: "2026-07-23", summary: "test", topics: ["a"], generatedAt: 1 });
    const kv = { get: vi.fn().mockResolvedValue(cached) } as unknown as KVNamespace;
    const res = await handleRequest(
      new Request("https://proxy.dev/api/summary"),
      mockEnv({ SUMMARY_KV: kv }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { summary: string };
    expect(body.summary).toBe("test");
  });
});

describe("generateSummary - CDATA handling", () => {
  const CDATA_XML = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Tech News</title>
  <link>https://tech.example.com</link>
  <description>Tech feed</description>
  <item>
    <title><![CDATA[Hello & Goodbye]]></title>
    <link>https://tech.example.com/1</link>
    <description><![CDATA[<p>A & b story</p>]]></description>
  </item>
  <item>
    <title>Plain Title</title>
    <link>https://tech.example.com/2</link>
    <description>Plain description</description>
  </item>
</channel></rss>`;

  function mockKV() {
    return {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn().mockResolvedValue({ keys: [] }),
    } as unknown as KVNamespace;
  }

  function mockOpenAI() {
    return vi.fn(async (url: string | URL | Request) => {
      if (url.toString().includes("openai.com")) {
        return new Response(
          JSON.stringify({
            choices: [
              { message: { content: '{"summary":"test","topics":["a"]}' } },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(CDATA_XML, {
        status: 200,
        headers: { "Content-Type": "application/xml" },
      });
    }) as unknown as typeof fetch;
  }

  it("extracts titles and descriptions from CDATA sections", async () => {
    const fetchMock = mockOpenAI();
    await generateSummary(
      ["https://tech.example.com/rss"],
      "sk-test",
      mockKV(),
      fetchMock,
    );

    // Find the OpenAI call and inspect the prompt
    const openAICall = (fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
      (call) => call[0].toString().includes("openai.com"),
    );
    expect(openAICall).toBeTruthy();
    const body = JSON.parse(openAICall![1].body);
    const prompt = body.messages[1].content;

    // CDATA-wrapped title must be extracted, not lost
    expect(prompt).toContain("Hello & Goodbye");
    // CDATA-wrapped description must also be extracted
    expect(prompt).toContain("A & b story");
  });
});
