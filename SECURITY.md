# Security Policy

## Supported versions

FeedPop is an early-stage project. Security fixes are applied to the latest
release on the `main` branch only.

| Version | Supported |
| ------- | --------- |
| latest `main` | ✅ |
| older releases | ❌ |

## Reporting a vulnerability

If you find a security issue, **please do not open a public GitHub issue.**

Instead, email the maintainer at sijosam1905@gmail.com with:

- A description of the issue and its potential impact.
- The steps to reproduce it.
- Any relevant logs, screenshots, or proof-of-concept.

You'll get an acknowledgment within 72 hours. We'll work with you to understand
the scope and coordinate a fix and disclosure timeline. Please avoid publicly
disclosing the issue until a fix is available.

## Scope

FeedPop fetches feed URLs on the user's behalf through a Cloudflare Worker
proxy and renders third-party feed content in the browser using DOMPurify for
HTML sanitization. Relevant areas include:

- The feed proxy worker (`worker/src/`) and its Vite plugin twin (`vite/`).
- HTML sanitization of feed content (`src/`).
- Handling of user-supplied feed URLs and storage (`src/`).

Out of scope: vulnerabilities in dependencies themselves — report those to the
upstream project. You can still let us know so we can bump the version.

## Acknowledgments

Responsible disclosures help keep the project safe for everyone. Contributors
who report a valid issue will be credited here unless they prefer to remain
anonymous.