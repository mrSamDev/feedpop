# FeedPop

A small RSS and Atom reader. You add a feed URL, the app pulls the articles, and your subscriptions stick around between visits. It's built with React, Vite, Tailwind, and TanStack Query, with a thin Cloudflare Worker doing the fetching.

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