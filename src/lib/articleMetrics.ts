const WORDS_PER_MINUTE = 200;

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent ?? "";
}

export function wordCount(content: string): number {
  const text = stripHtml(content).trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

export function estimateReadTime(content: string): number {
  const minutes = wordCount(content) / WORDS_PER_MINUTE;
  return Math.max(1, Math.ceil(minutes));
}

