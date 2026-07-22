---
name: RSS-client
description: Compact, scannable UI for an RSS feed reader. Friendly but efficient. Supports light and dark themes.
colors:
  ink: "#004747"
  panel: "#f0f5f5"
  panel-2: "#ffffff"
  surface: "#e8eeee"
  bg: "#f5f8f8"
  yellow: "#f9d84a"
  pink: "#ff7fb4"
  pink-cta: "#ff82b2"
  pink-cta-deep: "#ff5d97"
  pink-cta-shadow: "#ca3e74"
  pink-error: "#972959"
  melon: "#ff9f6e"
  mint: "#92efc5"
  bluey: "#6d8cff"
colors-dark:
  ink: "#ffffff"
  panel: "#171717"
  panel-2: "#000000"
  surface: "#111111"
  bg: "#0d0d0d"
  yellow: "#f9d84a"
  pink: "#ff7fb4"
  pink-cta: "#ff82b2"
  pink-cta-deep: "#ff5d97"
  pink-cta-shadow: "#ca3e74"
  pink-error: "#ff8caa"
  melon: "#ff9f6e"
  mint: "#2a6b52"
  bluey: "#6d8cff"
typography:
  display-app:
    fontFamily: Baloo 2
    fontSize: 1.5rem
    fontWeight: 800
    lineHeight: "1.1"
  display-card:
    fontFamily: Baloo 2
    fontSize: 1.05rem
    fontWeight: 700
    lineHeight: "1.2"
  display-modal:
    fontFamily: Baloo 2
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: "1.2"
  display-section:
    fontFamily: Baloo 2
    fontSize: 1.15rem
    fontWeight: 700
    lineHeight: "1.2"
  body-md:
    fontFamily: Nunito
    fontSize: 0.9rem
    fontWeight: 500
    lineHeight: "1.5"
  body-base:
    fontFamily: Nunito
    fontSize: 0.85rem
    fontWeight: 500
    lineHeight: "1.5"
  body-sm:
    fontFamily: Nunito
    fontSize: 0.78rem
    fontWeight: 600
    lineHeight: "1.4"
  label-caps:
    fontFamily: Nunito
    fontSize: 0.7rem
    fontWeight: 700
    letterSpacing: 0.06em
  label-ui:
    fontFamily: Nunito
    fontSize: 0.82rem
    fontWeight: 800
  stat-value:
    fontFamily: Nunito
    fontSize: 1rem
    fontWeight: 800
  badge:
    fontFamily: Nunito
    fontSize: 0.68rem
    fontWeight: 800
    letterSpacing: 0.06em
rounded:
  xs: 6px
  sm: 8px
  md: 12px
  input: 10px
  lg: 14px
  xl: 16px
  pill: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
components:
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.xl}"
    padding: 16px
  header-bar:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.xl}"
    padding: 12px 16px
  card:
    backgroundColor: "{colors.panel-2}"
    rounded: "{rounded.lg}"
    padding: 12px
  chip-type-article:
    backgroundColor: "{colors.pink}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: 3px 8px
  chip-type-video:
    backgroundColor: "{colors.bluey}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: 3px 8px
  chip-neutral:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: 3px 8px
  chip-category:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: 3px 8px
  button-refresh:
    backgroundColor: "linear-gradient(180deg, {colors.pink-cta} 0%, {colors.pink-cta-deep} 100%)"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: 8px 14px
  button-secondary:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: 8px 14px
  button-open-article:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: 8px 14px
  button-theme-toggle:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: 8px 10px
  text-input:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: 8px 12px
  sources-container:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 8px 12px
---

## Overview

Compact Friendly. FeedPop is a clean, scannable RSS reader built for people who want to skim many articles fast. The aesthetic keeps a touch of warmth — rounded corners, a friendly display font, pastel accent chips — but prioritizes information density over decoration. Think of it as a well-organized reading list, not a candy box.

The design respects the user's screen real estate. Borders are thin (1–2px), shadows are subtle, cards are compact, and the grid packs three columns on desktop. Every pixel earns its place. The goal is to make "checking your feeds" feel like glancing at a well-curated index — you see what's new at a glance, click what interests you, and move on.

The app supports both light and dark themes. A toggle in the header switches instantly. The preference is persisted to localStorage and defaults to the system's `prefers-color-scheme`.

## Colors

The palette keeps the original warm ink and pastel accents but uses them more sparingly. Accents appear on chips and the refresh button only — large surfaces stay neutral.

### Light theme (default)

- **Ink (#004747):** Dark teal — `main` — for all text and borders. The single structural color. Replaces the original navy.
- **Panel (#f0f5f5):** Teal-tinted off-white for header and primary surfaces. Subtle, cool, friendly.
- **Panel-2 (#ffffff):** Pure white for article cards — crisp separation from the teal-tinted panel.
- **Surface (#e8eeee):** Light teal-gray for secondary containers (sources bar, neutral chips).
- **BG (#f5f8f8):** Page background. Solid very-light teal-white — no gradients.
- **Yellow (#f9d84a):** "Read original" CTA in the modal and the fresh-post dot.
- **Pink (#ff7fb4):** Chip color for "article" type tags. Pink and teal are complementary — the accent pops.
- **Pink-CTA (#ff82b2 → #ff5d97):** The refresh/sync button gradient. Primary action color. Shadow: `#ca3e74`.
- **Pink-error (#972959):** Dark rose for error text and error borders.
- **Mint (#92efc5):** Category chips and the active/selected source highlight.
- **Bluey (#6d8cff):** "Video" type chip only.

### Dark theme

Simple black and white — no tinted surfaces, just neutral grays.

- **Ink (#ffffff):** Pure white for all text and borders.
- **Panel (#171717):** Near-black panel for header and modal.
- **Panel-2 (#000000):** Pure black card surface — the white 1px border provides high-contrast separation from the panel and background.
- **Surface (#111111):** Near-black for chips and sources bar (recessed look).
- **BG (#0d0d0d):** Near-black page background.
- **Yellow (#f9d84a):** Unchanged. The "Read original" button uses fixed black text (#000000) in dark mode for contrast.
- **Pink (#ff7fb4):** Unchanged. Bright enough on black.
- **Pink-CTA (#ff82b2 → #ff5d97):** Unchanged gradient. White text still works.
- **Pink-error (#ff8caa):** Brighter rose for error text — the light-theme value is too dark on black.
- **Mint (#2d7d6a):** Muted green for selected/category chips. White text on this green has good contrast.
- **Bluey (#6d8cff):** Unchanged. Works on black.

In dark mode, shadows use pure black (`rgb(0 0 0 / ...)`). The dark theme is simple black and white — no teal tints, just neutral grays.

## Typography

Two fonts: Baloo 2 for display, Nunito for body and UI. Both are rounded and friendly but used at practical sizes.

**Baloo 2** (display) is used for the app name (`display-app`, 1.5rem), article card titles (`display-card`, 1.05rem), and modal title (`display-modal`, 1.5rem). Always 700 weight. Line height 1.2 — readable, not cramped.

**Nunito** (body) handles everything else. Article excerpts use `body-md` (0.9rem). Metadata and chip text use `body-sm` (0.78rem). Filter labels use `label-ui` (0.82rem, 800 weight). Small uppercase labels use `label-caps` (0.7rem, 700 weight, 0.06em tracking).

Font sizes are deliberately small for an RSS reader — the priority is fitting more articles per screen, not making each one shout.

## Layout

The layout is a sidebar + main content area, with a compact header bar on top.

```
┌───────────────────────────────────────────┐
│  FeedPop        [stats]    [☾] [↻]        │  compact header
├──────────┬────────────────────────────────┤
│ Sources  │  [ ─── Add RSS feed box ─── ]  │
│ ├ All    │  ┌──────┐ ┌──────┐ ┌──────┐    │
│ ├ Feed1  │  │ card │ │ card │ │ card │    │
│ ├ Feed2  │  └──────┘ └──────┘ └──────┘    │
│ └ Feed3  │  ┌──────┐ ┌──────┐ ┌──────┐    │
│          │  │ card │ │ card │ │ card │    │
└──────────┴────────────────────────────────┘
```

**Header bar:** A single horizontal panel containing the app name (left), inline stat pills (hidden on mobile), and the theme toggle + refresh button (right). ~50px tall on desktop.

**Sidebar (left):** A vertical panel listing all subscribed feeds. "All feeds" at the top, each feed below as a full-width clickable item. Selected feed is highlighted with mint background. Remove buttons appear on hover. 224px wide on desktop (`lg:`), full width and stacked above main content on mobile.

**Main content (right):** 
- **Add feed box:** A panel at the top of the main area with the RSS URL input and "Add feed" button. Always visible.
- **Article grid:** Below the add feed box. Three columns on `xl:`, two on `sm:`, one on mobile. Gap is 12px. Cards are compact and the entire card is clickable (opens the modal).

**Modal:** Centered overlay, max-width 640px. Title, metadata, sanitized HTML content, and a "Read original" link. Borders are 2px ink, 16px radius.

Spacing follows a 4px base unit. Common values: 4, 8, 12, 16, 24px. Gaps between chips use 6px.

## Elevation & Depth

Depth is subtle — just enough to separate layers without adding visual noise.

**Panels (header, modal):** `0 2px 8px rgb(var(--shadow-rgb) / 0.08)` — a soft, small shadow. `--shadow-rgb` is `0 71 71` in light mode, `0 0 0` in dark mode.

**Article cards:** `0 1px 3px rgb(var(--shadow-rgb) / 0.06)` — barely there, just enough to lift the white card off the warm background. On hover: `0 2px 8px rgb(var(--shadow-rgb) / 0.12)` with a subtle `translateY(-1px)` lift.

**Refresh button:** `0 4px 0 #ca3e74` — keeps the signature hard shadow on the primary CTA only. On hover: `translateY(-1px)`. On active: `translateY(2px)` with `0 2px 0` shadow.

No thumbnail offset blocks. No decorative rotated shapes. The content is the design.

## Shapes

Roundness is still part of the identity, but tempered for density:
- **pill (9999px):** all chips, all buttons, stat pills in the header
- **xl (16px):** header bar, modal container
- **lg (14px):** article cards, sources container
- **input (10px):** text input, select dropdowns
- **sm (8px):** minor UI elements, thumbnails
- **xs (6px):** small inline elements

Corners are rounded but not exaggerated. Cards at 14px look friendly without wasting corner space.

## Dark Mode

The app implements a manual light/dark theme toggle with system preference fallback.

**Implementation:** A `data-theme="light"` or `data-theme="dark"` attribute is set on `<html>`. All color tokens are CSS custom properties, so dark mode is a pure variable override — no component code changes needed. The `useTheme` hook in `src/theme.ts` manages state, persists to `localStorage` (key: `feedpop-theme`), and defaults to `window.matchMedia("(prefers-color-scheme: dark)")` on first visit.

**FOUC prevention:** An inline script in `index.html` reads the stored preference and sets `data-theme` before React hydrates, preventing a flash of the wrong theme.

**Toggle button:** A compact secondary-style button in the header bar showing "☾" in light mode (click → dark) and "☀" in dark mode (click → light). Same 2px border, pill radius, and compact padding as other buttons.

**Adaptations beyond color variables:**
- The "Read original" button uses fixed black text (`#000000`) in dark mode — white on bright yellow has poor contrast.
- Shadows use pure black in both themes (light: teal-tinted, dark: pure black).
- Native form controls and scrollbars respect the theme via `color-scheme: dark`.
- The modal backdrop always uses `bg-black/40` (not `bg-ink/40`) so it stays dark in both themes.

## Components

**Header bar:** The primary navigation surface. Panel background, 2px ink border, 16px radius, subtle shadow. Contains:
- App name ("FeedPop") in Baloo 2 1.5rem
- Inline stat pills (hidden on mobile): unread count, source count, last sync
- Theme toggle button (☾ / ☀)
- Refresh button (pink gradient CTA)

**Add feed box:** A panel at the top of the main content area. Contains the RSS URL text input (flex-1) and an "Add feed" button. Always visible so users can add feeds at any time.

**Sources sidebar:** A vertical panel on the left side. Contains a "Sources" label, an "All feeds" button, and a list of subscribed feed buttons. Each feed button is full-width, left-aligned, with a truncated title. Selected feed gets mint background + ink border. Remove (✕) buttons appear on hover. 224px wide on desktop, full width stacked above main on mobile.

**Article cards:** Compact, clickable, white background (panel-2). 1px ink border, 14px radius, subtle shadow. 12px padding. Layout:
- Thumbnail (optional): full-width, 80px tall, 8px radius, 1px border, object-cover. Only shown if the article has an image.
- Type chip + date chip: inline row above the title, small (0.68rem)
- Title: Baloo 2, 1.05rem, 700 weight, 1.2 line-height, `line-clamp-2`
- Excerpt: Nunito, 0.85rem, `line-clamp-2`, ink at 80% opacity
- Read time + word count: small neutral chips at the bottom
- No separate "Open article" button — the entire card is clickable and opens the modal. A subtle hover state (shadow + 1px lift) signals interactivity.
- Fresh flag: tiny yellow dot in the metadata row for items newer than 24h.

**Stat pills (header):** Small inline pills with a bold number and a tiny uppercase label. Surface background, 1px ink border, pill radius, 4px 10px padding.

**Chips:** All pill radius + 1px ink border. Compact: 3px 8px padding, 0.68rem text.
- Article type: pink background, white text
- Video type: bluey background, white text
- Neutral (date, read-time, word-count): surface background, ink text
- Category: mint background, ink text
- Selected source: mint background (toggled on the neutral chip)

**Refresh button (primary CTA):** Vertical gradient `#ff82b2 → #ff5d97`, white text, pill, 2px ink border, hard shadow `0 4px 0 #ca3e74`. Compact: 8px 14px padding, 0.82rem text. Contains a sync icon or "…" for loading. Hover lifts `translateY(-1px)`.

**Secondary buttons:** White/panel-2 background, ink text, 2px ink border, pill. Used for "Add", theme toggle, modal close. Compact: 8px 14px padding. Hover lifts `translateY(-1px)`.

**Read original button (modal):** Yellow background, ink text, 2px ink border, pill. Same compact sizing. Includes an arrow icon. In dark mode, text is fixed to `#15142a` for contrast.

**Text input:** White/panel-2 background, 1px ink border, 10px radius, 8px 12px padding. Placeholder uses ink at 40% opacity. Flat, no inset shadow.

**Sources container:** Surface background, 1px solid ink border, 14px radius. The sidebar panel uses the standard `.panel` class; individual feed items use transparent borders that get ink border + mint background when selected.

**Modal:** Panel background, 2px ink border, 16px radius, subtle shadow. Header with title + close button (2px ink border separator), scrollable sanitized content area, footer with "Read original" link. Max-width 640px, max-height 80vh. Backdrop is `bg-black/40` in both themes.

## Do's and Don'ts

**Do:**
- Use 1–2px ink borders on cards and inputs, 2px on panels and the modal
- Keep article cards compact — 12px padding, small thumbnails, 2-line clamps
- Make the entire article card clickable to open the modal
- Use three columns on desktop for the article grid
- Keep the header to a single compact bar — no giant hero
- Use Baloo 2 for titles and the app name only
- Apply the hard CTA shadow (`0 4px 0 #ca3e74`) to the refresh button only
- Use `translateY(-1px)` on hover for cards and buttons
- Show read time and word count as small chips at the bottom of each card
- Support dark mode via CSS variable overrides on `[data-theme="dark"]`
- Persist theme preference to localStorage with system preference fallback

**Don't:**
- Use borders thicker than 2px anywhere
- Use 4px borders, 32px radii, or heavy double shadows — that's the old design
- Give article cards their own "Open article" button — the card itself is the button
- Use a giant hero section or display text larger than 1.5rem (modal/app name)
- Use the thumbnail offset block or decorative rotated shapes
- Use dashed borders — solid only
- Use gray text — use `ink` at reduced opacity (`ink/60`, `ink/80`) instead
- Apply the CTA pink gradient to anything other than the refresh button
- Use fonts outside Baloo 2 / Nunito
- Waste vertical space — an RSS reader should show many articles per screen
- Hardcode colors in components — use CSS variables so dark mode works automatically
- Use `bg-ink/40` for the modal backdrop — use `bg-black/40` so it stays dark in both themes