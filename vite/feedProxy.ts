import type { Plugin } from "vite";
import type { ServerResponse } from "node:http";
import { handleRequest } from "../worker/src/handler";

// Note: imports ServerResponse from node:http, tying this plugin to Node.
// Fine for Vite — switch to a non-Node dev server would need a different proxy.

type MiddlewareServer = { middlewares: { use: (path: string, handler: (req: unknown, res: ServerResponse) => void) => void } };

// Routes /api/feed?url=... through the same handler the Cloudflare Worker uses,
// so dev and production behave identically. Node 18+ has a global fetch.
function attachProxy(server: MiddlewareServer) {
  server.middlewares.use("/api/feed", async (req, res) => {
    const nodeReq = req as { url?: string; method?: string; headers: Record<string, string | string[] | undefined> };
    const host = nodeReq.headers.host ?? "localhost";
    const fullUrl = `http://${host}/api/feed${nodeReq.url ?? ""}`;
    const request = new Request(fullUrl, { method: nodeReq.method ?? "GET" });
    const response = await handleRequest(request);

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
