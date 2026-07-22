import { describe, it, expect } from "vitest";
import { estimateReadTime, wordCount, extractImage } from "../src/lib/articleMetrics";;

describe("wordCount", () => {
  it("counts words in plain text", () => {
    expect(wordCount("one two three four")).toBe(4);
  });

  it("strips HTML tags before counting", () => {
    expect(wordCount("<p>hello <b>world</b></p>")).toBe(2);
  });

  it("returns 0 for empty content", () => {
    expect(wordCount("")).toBe(0);
  });
});

describe("estimateReadTime", () => {
  it("estimates 1 minute for short text", () => {
    expect(estimateReadTime("a few words here")).toBe(1);
  });

  it("estimates proportional minutes for longer text", () => {
    const words = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
    expect(estimateReadTime(words)).toBe(2);
  });

  it("returns at least 1 for any content", () => {
    expect(estimateReadTime("tiny")).toBe(1);
  });
});

describe("extractImage", () => {
  it("extracts the first img src from HTML content", () => {
    const html = '<p>text</p><img src="https://x.com/img.jpg" alt="pic"><p>more</p>';
    expect(extractImage(html)).toBe("https://x.com/img.jpg");
  });

  it("returns null when no image exists", () => {
    expect(extractImage("<p>no image here</p>")).toBeNull();
  });

  it("returns null for empty content", () => {
    expect(extractImage("")).toBeNull();
  });
});