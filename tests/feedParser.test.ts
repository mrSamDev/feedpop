import { describe, it, expect, beforeAll } from "vitest";
import { parseFeed } from "../src/lib/feedParser";;

const RSS2_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Test Blog</title>
    <link>https://blog.example.com</link>
    <description>A blog about testing</description>
    <item>
      <title>First Post</title>
      <link>https://blog.example.com/first</link>
      <description>Summary of the first post</description>
      <content:encoded><![CDATA[<p>Full content here</p>]]></content:encoded>
      <author>author@example.com (Jane Doe)</author>
      <pubDate>Mon, 21 Jul 2025 10:00:00 GMT</pubDate>
      <guid>https://blog.example.com/first</guid>
    </item>
    <item>
      <title>Second Post</title>
      <link>https://blog.example.com/second</link>
      <description>Summary of the second post</description>
      <pubDate>Tue, 22 Jul 2025 12:00:00 GMT</pubDate>
      <guid>https://blog.example.com/second</guid>
    </item>
  </channel>
</rss>`;

const ATOM_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Blog</title>
  <link href="https://atom.example.com" rel="alternate"/>
  <subtitle>An atom feed</subtitle>
  <entry>
    <title>Atom Entry One</title>
    <link href="https://atom.example.com/one" rel="alternate"/>
    <id>tag:atom.example.com,2025:/one</id>
    <summary>Atom summary text</summary>
    <content type="html"><![CDATA[<p>Atom full content</p>]]></content>
    <author><name>John Smith</name></author>
    <published>2025-07-20T08:00:00Z</published>
  </entry>
</feed>`;

describe("parseFeed - RSS 2.0", () => {
  let result: Awaited<ReturnType<typeof parseFeed>>;

  beforeAll(async () => {
    result = await parseFeed(RSS2_SAMPLE, "https://blog.example.com/rss");
  });

  it("extracts channel metadata", () => {
    expect(result.title).toBe("Test Blog");
    expect(result.link).toBe("https://blog.example.com");
    expect(result.description).toBe("A blog about testing");
  });

  it("uses the source URL as feed url", () => {
    expect(result.url).toBe("https://blog.example.com/rss");
  });

  it("parses two articles", () => {
    expect(result.articles).toHaveLength(2);
  });

  it("parses article fields", () => {
    const first = result.articles[0];
    expect(first.title).toBe("First Post");
    expect(first.link).toBe("https://blog.example.com/first");
    expect(first.content).toBe("<p>Full content here</p>");
    expect(first.author).toBe("Jane Doe");
    expect(first.publishedAt).toBe(Date.parse("Mon, 21 Jul 2025 10:00:00 GMT"));
  });

  it("falls back to description as content when content:encoded is missing", () => {
    const second = result.articles[1];
    expect(second.content).toBe("Summary of the second post");
  });

  it("generates stable unique ids for articles", () => {
    expect(result.articles[0].id).toBeTruthy();
    expect(result.articles[1].id).not.toBe(result.articles[0].id);
  });
});

describe("parseFeed - Atom", () => {
  it("parses entry fields", async () => {
    const result = await parseFeed(ATOM_SAMPLE, "https://atom.example.com/feed");
    expect(result.title).toBe("Atom Blog");
    expect(result.link).toBe("https://atom.example.com");
    expect(result.description).toBe("An atom feed");

    const entry = result.articles[0];
    expect(entry.title).toBe("Atom Entry One");
    expect(entry.link).toBe("https://atom.example.com/one");
    expect(entry.content).toBe("<p>Atom full content</p>");
    expect(entry.author).toBe("John Smith");
    expect(entry.publishedAt).toBe(Date.parse("2025-07-20T08:00:00Z"));
  });
});

describe("parseFeed - error cases", () => {
  it("throws on non-XML input", async () => {
    await expect(parseFeed("not xml at all", "https://example.com/feed")).rejects.toThrow();
  });

  it("throws on empty input", async () => {
    await expect(parseFeed("", "https://example.com/feed")).rejects.toThrow();
  });

  it("handles items with missing dates gracefully", async () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0"><channel>
        <title>No Date Feed</title><link>https://x.com</link><description>d</description>
        <item><title>No Date</title><link>https://x.com/1</link></item>
      </channel></rss>`;
    const result = await parseFeed(xml, "https://x.com/rss");
    expect(result.articles[0].publishedAt).toBeNull();
  });

  it("handles CDATA in title", async () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0"><channel>
        <title><![CDATA[My Special Feed]]></title><link>https://x.com</link><description>d</description>
        <item><title><![CDATA[Hello & Goodbye]]></title><link>https://x.com/1</link></item>
      </channel></rss>`;
    const result = await parseFeed(xml, "https://x.com/rss");
    expect(result.title).toBe("My Special Feed");
    expect(result.articles[0].title).toBe("Hello & Goodbye");
  });
});