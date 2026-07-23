import type { Plugin } from "vite";
import type { ServerResponse } from "node:http";
import { handleRequest } from "../worker/src/handler";
import type { Env } from "../worker/src/index";

// Note: imports ServerResponse from node:http, tying this plugin to Node.
// Fine for Vite — switch to a non-Node dev server would need a different proxy.

type MiddlewareServer = { middlewares: { use: (path: string, handler: (req: unknown, res: ServerResponse) => void) => void } };

function makeDevEnv(): Env {
  const today = new Date().toISOString().slice(0, 10);
  const devSummary = JSON.stringify({
    date: today,
    summary: "Good morning! Here's what's happening today. Tech news is buzzing with AI updates, while open-source projects see fresh releases. Stay tuned for more throughout the day.",
    topics: ["AI & ML", "Open Source", "Tech Industry", "Dev Tools"],
    generatedAt: Date.now(),
  });

  const store = new Map<string, string>();
  store.set(`summary-${today}`, devSummary);

  return {
    SUMMARY_KV: {
      get: async (key) => store.get(key) ?? null,
      put: async (key, value) => { store.set(key, value); },
      delete: async (key) => { store.delete(key); },
      list: async () => ({ keys: Array.from(store.keys()).map((name) => ({ name })) }),
    } as unknown as KVNamespace,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
    AUTH_TOKEN: process.env.AUTH_TOKEN ?? "dev-token",
  };
}

function attachProxy(server: MiddlewareServer) {
  const devEnv = makeDevEnv();

  server.middlewares.use("/api/feed", async (req, res) => {
    const nodeReq = req as { url?: string; method?: string; headers: Record<string, string | string[] | undefined> };
    const host = nodeReq.headers.host ?? "localhost";
    // connect strips mount path from req.url, add it back
    const fullUrl = `http://${host}/api/feed${nodeReq.url ?? ""}`;
    const request = new Request(fullUrl, { method: nodeReq.method ?? "GET" });
    const response = await handleRequest(request, devEnv);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(await response.text());
  });

  server.middlewares.use("/api/summary", async (req, res) => {
    const nodeReq = req as { url?: string; method?: string; headers: Record<string, string | string[] | undefined>; on: (event: string, cb: (chunk: string) => void) => void };
    const host = nodeReq.headers.host ?? "localhost";
    // connect strips mount path from req.url, add it back
    const fullUrl = `http://${host}/api/summary${nodeReq.url ?? ""}`;

    let body = "";
    if (nodeReq.method === "POST") {
      body = await new Promise<string>((resolve) => {
        let data = "";
        nodeReq.on("data", (chunk: string) => { data += chunk; });
        nodeReq.on("end", () => resolve(data));
      });
    }

    const request = new Request(fullUrl, {
      method: nodeReq.method ?? "GET",
      headers: Object.fromEntries(
        Object.entries(nodeReq.headers).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v ?? ""]),
      ),
      body: nodeReq.method === "POST" ? body : undefined,
    });

    const response = await handleRequest(request, devEnv);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(await response.text());
  });
}

export function feedProxyPlugin(): Plugin {
  return {
    name: "feed-proxy",
    configureServer(server) {
      attachProxy(server);
    },
    configurePreviewServer(server) {
      attachProxy(server as unknown as MiddlewareServer);
    },
  };
}
