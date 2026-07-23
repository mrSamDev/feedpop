/** Decode HTML entities using the browser's textarea trick. */
export function decodeEntities(str: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = str;
  return el.value;
}

/**
 * Strip HTML tags, inserting line breaks before block elements so the
 * result preserves paragraph structure. Entity-decoded, trimmed.
 */
export function stripHtmlToSnippet(str: string): string {
  if (!str) return "";
  const withBreaks = str.replace(
    /([^\n])<\/?(h|br|p|ul|ol|li|blockquote|section|table|tr|div)(?:.|\n)*?>([^\n])/gm,
    "$1\n$3",
  );
  const stripped = withBreaks.replace(/<(?:.|\n)*?>/gm, "");
  return decodeEntities(stripped).trim();
}

/** Extract the first <img> src from HTML content, or null. */
export function extractFirstImage(content: string): string | null {
  if (!content) return null;
  const doc = new DOMParser().parseFromString(content, "text/html");
  return doc.querySelector("img")?.getAttribute("src") ?? null;
}
