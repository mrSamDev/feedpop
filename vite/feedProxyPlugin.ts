import type { Plugin } from "vite";
import type { ServerResponse } from "node:http";
import { handleRequest } from "../worker/src/handler";
import type { Env } from "../worker/src/index";

// Note: imports ServerResponse from node:http, tying this plugin to Node.
// Fine for Vite — switch to a non-Node dev server would need a different proxy.

type MiddlewareServer = { middlewares: { use: (path: string, handler: (req: unknown, res: ServerResponse) => void) => void } };

type NodeReq = { url?: string; method?: string; headers: Record<string, string | string[] | undefined>; on?: (event: string, cb: (chunk: string) => void) => void };

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

async function proxyRequest(mountPath: string, req: unknown, res: ServerResponse, env: Env) {
  const nodeReq = req as NodeReq;
  const host = nodeReq.headers.host ?? "localhost";
  const fullUrl = `http://${host}${mountPath}${nodeReq.url ?? ""}`;

  let body: string | undefined;
  if (nodeReq.method === "POST") {
    body = await new Promise<string>((resolve) => {
      let data = "";
      nodeReq.on?.("data", (chunk: string) => { data += chunk; });
      nodeReq.on?.("end", () => resolve(data));
    });
  }

  const request = new Request(fullUrl, {
    method: nodeReq.method ?? "GET",
    headers: Object.fromEntries(
      Object.entries(nodeReq.headers).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v ?? ""]),
    ),
    body,
  });

  const response = await handleRequest(request, env);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(await response.text());
}

function attachProxy(server: MiddlewareServer) {
  const devEnv = makeDevEnv();
  server.middlewares.use("/api/feed", (req, res) => proxyRequest("/api/feed", req, res, devEnv));
  server.middlewares.use("/api/summary", (req, res) => proxyRequest("/api/summary", req, res, devEnv));
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
