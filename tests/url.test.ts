import { describe, it, expect } from "vitest";
import { isValidFeedUrl, normalizeUrl } from "../src/lib/url";;

describe("isValidFeedUrl", () => {
  it("accepts a normal http URL", () => {
    expect(isValidFeedUrl("https://hnrss.org/frontpage")).toBe(true);
  });

  it("accepts http URLs", () => {
    expect(isValidFeedUrl("http://example.com/feed")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isValidFeedUrl("")).toBe(false);
  });

  it("rejects non-URL strings", () => {
    expect(isValidFeedUrl("hello world")).toBe(false);
  });

  it("rejects URLs without a protocol", () => {
    expect(isValidFeedUrl("example.com/feed")).toBe(false);
  });

  it("rejects javascript: URLs for safety", () => {
    expect(isValidFeedUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects ftp URLs", () => {
    expect(isValidFeedUrl("ftp://example.com/feed")).toBe(false);
  });
});

describe("normalizeUrl", () => {
  it("adds https:// when a bare domain is given", () => {
    expect(normalizeUrl("hnrss.org/frontpage")).toBe("https://hnrss.org/frontpage");
  });

  it("leaves a full URL unchanged", () => {
    expect(normalizeUrl("https://hnrss.org/frontpage")).toBe("https://hnrss.org/frontpage");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeUrl("  https://hnrss.org/frontpage  ")).toBe("https://hnrss.org/frontpage");
  });
});