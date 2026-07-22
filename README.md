# FeedPop

A small RSS and Atom reader. You add a feed URL, the app pulls the articles, and your subscriptions stick around between visits.

**Stack:** React 19 · Vite 8 · Tailwind CSS v4 · TanStack Query v5 · TypeScript 6 · Cloudflare Workers · Vitest + Testing Library

## Why there's an API at all

A browser page can't fetch just any URL. Feeds live on other people's servers, and most of those servers never send CORS headers, so a direct request from the page dies before the first byte lands. The only way around it is to fetch from somewhere that isn't the browser.

That's the worker's whole job. It takes a feed URL, fetches it server-side, and hands the body back with CORS headers attached. The page only ever talks to the proxy, so the browser's origin rules stay happy.

A ten-second timeout stops a slow feed from hanging the tab. Bad URLs come back as real errors instead of silent failures.

One handler does the work, and both environments share it. In dev, a Vite plugin routes `/api/feed` through that same handler, so local behavior matches production.

In production the handler runs as a Cloudflare Worker. You write the fetch logic once and never keep two copies in sync.

## Running it locally

You'll need Node 18 or newer, plus Bun or pnpm. From the repo root:

- `bun install`: install dependencies
- `bun run dev`: start Vite, proxy included, at `http://localhost:5173`
- `bun run test`: run the vitest suite
- `bun run typecheck`: type-check without emitting anything

No separate worker process to start. The dev server is the proxy.

## Testing

Vitest runs in jsdom, with Testing Library on top for the components. Tests live under `tests/` and cover the parser, the proxy handler, the storage layer, and an integration pass through the app. They check behavior, not which functions got called.

## Deploying to Cloudflare

The app ships as two deployments, both on Cloudflare.

The worker lives in `worker/`. From that directory, run `npx wrangler deploy` and note the URL it prints, something like `https://rss-feed-proxy.<your-subdomain>.workers.dev`. Then build the frontend with `bun run build` and put the `dist/` folder on Cloudflare Pages.

Tell the frontend where the proxy lives by setting `VITE_PROXY_URL` to that worker URL at build time. Without it, the app won't know where to send feed requests.

Leave `VITE_PROXY_URL` unset and the frontend falls back to `/api/feed`. That only works when the page and the proxy share an origin, which is true for a single Pages project with a Pages Function but not when the two are split across Workers and Pages. Pick one setup and set the variable to match.

If `wrangler` isn't installed, `npx wrangler` will pull it on demand. You'll need to run `npx wrangler login` once to authenticate.

## Deploying with Make

A `Makefile` wraps the whole workflow so you don't have to remember the individual commands. Run `make help` to see every target.

### One-shot full deploy

```bash
make deploy-all
```

Deploys the worker first, then builds the frontend with `VITE_PROXY_URL` baked in and pushes it to Cloudflare Pages. Both halves end up live and wired together.

### Individual targets

| Target | What it does |
| --- | --- |
| `make install` | Install dependencies (auto-detects bun, pnpm, or npm) |
| `make dev` | Start the Vite dev server with the feed proxy included |
| `make build` | Build `dist/` with `VITE_PROXY_URL` baked in |
| `make test` | Run the vitest suite |
| `make typecheck` | Type-check without emitting |
| `make clean` | Remove build artifacts |
| `make deploy-worker` | Deploy the feed-proxy worker to Cloudflare Workers |
| `make deploy-pages` | Build and deploy the frontend to Cloudflare Pages (production branch) |
| `make deploy-all` | Deploy the worker, then build and deploy the frontend |
| `make worker-whoami` | Show the authenticated Cloudflare account |
| `make worker-dev` | Run the worker locally with `wrangler dev` |
| `make worker-tail` | Tail live worker logs |
| `make pages-list` | List Cloudflare Pages projects |
| `make pages-init` | Create the Pages project (run once) |

### Pointing the frontend at a different worker

The worker URL defaults to `https://rss-feed-proxy.howgreatfn.workers.dev`. Override it at the command line if your worker lives elsewhere:

```bash
make deploy-pages PROXY_URL=https://rss-feed-proxy.<your-subdomain>.workers.dev
```

Leave `PROXY_URL` empty and the frontend falls back to the relative `/api/feed` path, which only works when the page and the proxy share an origin.