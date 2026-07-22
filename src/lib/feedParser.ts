import type { Feed, Article } from "../types";

// rss-parser relies on Node's EventEmitter (via sax) and breaks in a Vite
// browser bundle, so we parse RSS/Atom with the native DOMParser instead.

type ItemSeed = {
  guid?: string;
  link?: string;
  title?: string;
};

function text(el: Element | null | undefined): string {
  return el?.textContent?.trim() ?? "";
}

/** Direct child elements whose local name (ignoring any namespace prefix) matches. */
function children(el: Element, localName: string): Element[] {
  return Array.from(el.children).filter((c) => c.localName === localName);
}

function firstChild(el: Element, localName: string): Element | null {
  return children(el, localName)[0] ?? null;
}

// Mirrors rss-parser's getLink: prefer rel="alternate", else the first link.
function atomLink(el: Element): string {
  const links = children(el, "link");
  if (links.length === 0) return "";
  const alternate = links.find((l) => l.getAttribute("rel") === "alternate");
  return (alternate ?? links[0]).getAttribute("href") ?? "";
}

function parseAuthor(raw: string): string {
  if (!raw) return "";
  const emailMatch = raw.match(/([^()]+)\s*\(([^)]+)\)/);
  if (emailMatch) return emailMatch[2].trim();
  return raw;
}

function parseDate(raw: string): number | null {
  if (!raw) return null;
  const ts = Date.parse(raw);
  return Number.isNaN(ts) ? null : ts;
}

function hash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

function articleId(item: ItemSeed, index: number): string {
  const seed = item.guid || item.link || item.title || `#${index}`;
  return hash(seed);
}

function extractFirstImage(content: string): string | null {
  if (!content) return null;
  const doc = new DOMParser().parseFromString(content, "text/html");
  return doc.querySelector("img")?.getAttribute("src") ?? null;
}

function decodeEntities(str: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = str;
  return el.value;
}

/** Reproduces rss-parser's stripHtml + getSnippet (entity-decoded, tag-stripped, trimmed). */
function stripHtml(str: string): string {
  if (!str) return "";
  const withBreaks = str.replace(
    /([^\n])<\/?(h|br|p|ul|ol|li|blockquote|section|table|tr|div)(?:.|\n)*?>([^\n])/gm,
    "$1\n$3",
  );
  const stripped = withBreaks.replace(/<(?:.|\n)*?>/gm, "");
  return decodeEntities(stripped).trim();
}

function parseRssItem(item: Element, feedUrl: string, index: number): Article {
  const title = text(firstChild(item, "title"));
  const link = text(firstChild(item, "link"));
  const guid = text(firstChild(item, "guid"));
  const description = text(firstChild(item, "description"));
  // `content:encoded` is namespaced; its local name is `encoded`.
  const contentEncoded = text(firstChild(item, "encoded"));
  const summary = text(firstChild(item, "summary"));
  const author =
    text(firstChild(item, "author")) || text(firstChild(item, "creator"));
  const pubDate =
    text(firstChild(item, "pubDate")) || text(firstChild(item, "date"));

  // rss-parser sets item.content from <description> for RSS, so content
  // falls back through content:encoded → description → summary.
  const content = contentEncoded || description || summary || "";

  return {
    id: articleId({ guid, link, title }, index),
    feedId: feedUrl,
    title: title || "Untitled",
    link,
    description: stripHtml(description) || summary || "",
    content,
    imageUrl: extractFirstImage(content),
    author: parseAuthor(author),
    publishedAt: parseDate(pubDate),
  };
}

function parseAtomEntry(entry: Element, feedUrl: string, index: number): Article {
  const title = text(firstChild(entry, "title"));
  const link = atomLink(entry);
  const id = text(firstChild(entry, "id"));
  const summary = text(firstChild(entry, "summary"));
  const content = text(firstChild(entry, "content"));
  const authorEl = firstChild(entry, "author");
  const author = text(authorEl ? firstChild(authorEl, "name") : null);
  const published =
    text(firstChild(entry, "published")) || text(firstChild(entry, "updated"));

  const fullContent = content || summary || "";

  return {
    id: articleId({ guid: id, link, title }, index),
    feedId: feedUrl,
    title: title || "Untitled",
    link,
    // rss-parser derives contentSnippet from item.content (stripped).
    description: stripHtml(content) || summary || "",
    content: fullContent,
    imageUrl: extractFirstImage(fullContent),
    author: parseAuthor(author),
    publishedAt: parseDate(published),
  };
}

function parseRss(channel: Element, items: Element[], feedUrl: string): Feed {
  const title = text(firstChild(channel, "title"));
  const description = text(firstChild(channel, "description"));
  const link = text(firstChild(channel, "link"));

  return {
    id: feedUrl,
    url: feedUrl,
    title,
    description,
    link,
    articles: items.map((item, i) => parseRssItem(item, feedUrl, i)),
    lastFetchedAt: null,
  };
}

function parseAtom(feedEl: Element, feedUrl: string): Feed {
  const title = text(firstChild(feedEl, "title"));
  const subtitle = text(firstChild(feedEl, "subtitle"));
  const description = text(firstChild(feedEl, "description")) || subtitle;
  const link = atomLink(feedEl);

  return {
    id: feedUrl,
    url: feedUrl,
    title,
    description,
    link,
    articles: children(feedEl, "entry").map((entry, i) =>
      parseAtomEntry(entry, feedUrl, i),
    ),
    lastFetchedAt: null,
  };
}

export async function parseFeed(xml: string, feedUrl: string): Promise<Feed> {
  if (!xml.trim()) throw new Error("Feed is empty");

  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const parseError = doc.getElementsByTagName("parsererror")[0];
  if (parseError) throw new Error("Feed is not valid XML");

  const root = doc.documentElement;
  if (!root) {
    throw new Error("Feed has no title — not a valid RSS or Atom feed");
  }

  const rootName = root.localName;
  let feed: Feed;

  if (rootName === "feed") {
    feed = parseAtom(root, feedUrl);
  } else if (rootName === "rss") {
    const channel = firstChild(root, "channel");
    if (!channel) {
      throw new Error("Feed has no title — not a valid RSS or Atom feed");
    }
    feed = parseRss(channel, children(channel, "item"), feedUrl);
  } else if (rootName === "RDF") {
    // RSS 1.0 (rdf:RDF): channel + items are siblings under the root.
    const channel = firstChild(root, "channel");
    if (!channel) {
      throw new Error("Feed has no title — not a valid RSS or Atom feed");
    }
    feed = parseRss(channel, children(root, "item"), feedUrl);
  } else {
    throw new Error("Feed has no title — not a valid RSS or Atom feed");
  }

  if (!feed.title) {
    throw new Error("Feed has no title — not a valid RSS or Atom feed");
  }
  return feed;
}