import { describe, it, expect } from "vitest";
import { formatDate, formatRelative } from "../src/lib/format";;

describe("formatDate", () => {
  it("formats a timestamp as a readable date", () => {
    const ts = Date.parse("2025-07-21T10:00:00Z");
    expect(formatDate(ts)).toMatch(/2025/);
  });

  it("returns empty string for null", () => {
    expect(formatDate(null)).toBe("");
  });
});

describe("formatRelative", () => {
  it("returns 'just now' for very recent timestamps", () => {
    expect(formatRelative(Date.now() - 1000)).toBe("just now");
  });

  it("returns minutes ago", () => {
    expect(formatRelative(Date.now() - 5 * 60_000)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    expect(formatRelative(Date.now() - 3 * 3_600_000)).toBe("3h ago");
  });

  it("returns days ago", () => {
    expect(formatRelative(Date.now() - 2 * 86_400_000)).toBe("2d ago");
  });

  it("returns empty string for null", () => {
    expect(formatRelative(null)).toBe("");
  });
});