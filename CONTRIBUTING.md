# Contributing to FeedPop

Thanks for your interest in improving FeedPop! This guide covers how to get set up and what a good change looks like.

## Project at a glance

FeedPop is an RSS and Atom reader. The frontend is React 19 + Vite 8 + Tailwind v4 + TanStack Query v5, written in TypeScript. A small Cloudflare Worker acts as a feed proxy to get around browser CORS rules. Tests run on Vitest with Testing Library.

Read [`README.md`](./README.md) for the architecture overview and [`AGENTS.md`](./AGENTS.md) for the code style the project follows.

## Getting set up

You'll need Node 18+ and either [Bun](https://bun.sh) or pnpm.

```bash
bun install      # or: pnpm install
bun run dev      # start the Vite dev server (proxy included)
bun run test     # run the vitest suite
bun run typecheck
```

No separate worker process is needed in dev — a Vite plugin routes `/api/feed` through the same handler that runs in production.

## Before you open a pull request

1. **Run the full local check.** `bun run typecheck && bun run test` should pass with no failures.
2. **Keep tests behavior-focused.** Tests live under `tests/` and assert what the code *does*, not which functions it called. If you add a feature or fix a bug, add or update a test that would have caught the problem.
3. **Follow the style in `AGENTS.md`.** Prefer simple, readable code over clever code. One file, one responsibility. One function, one job. Comments explain *why*, not *what*. Delete abstraction until the code becomes harder to change.
4. **Write clear commit messages.** A short imperative summary on the first line; add detail below if the change isn't obvious.

## What changes are welcome

- **Bug fixes** — anything that makes the app behave incorrectly. Include a test that reproduces the bug.
- **New features** — keep them small and aligned with what FeedPop is: a reader that subscribes to feeds and shows articles. If a feature adds significant scope, open an issue first to talk it through.
- **Performance and accessibility improvements** — especially around feed parsing and the reading experience.
- **Docs and tests** — always welcome.

## What to avoid

- Large rewrites or refactors with no behavior change. If you believe one is warranted, open an issue and make the case first.
- Adding dependencies for things a few lines of code can handle.
- Pulling in dependencies with incompatible or non-permissive licenses.

## Reporting a bug

Open a [GitHub Issue](https://github.com/mrSamDev/feedpop/issues) and include:

- What you did (steps to reproduce).
- What you expected.
- What you saw instead, including any error text.
- Your browser and OS, if it's a frontend issue.

## Licensing

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE) that covers the project. See the `License` section in [`README.md`](./README.md).