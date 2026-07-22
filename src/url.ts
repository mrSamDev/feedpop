const ALLOWED_PROTOCOLS = ["http:", "https:"];

export function isValidFeedUrl(input: string): boolean {
  if (!input.trim()) return false;
  try {
    const parsed = new URL(input.trim());
    return ALLOWED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}