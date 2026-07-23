import type { DailySummary } from "../types";

function proxyUrl(): string {
  return import.meta.env.VITE_PROXY_URL ?? "";
}

function authToken(): string {
  return import.meta.env.VITE_AUTH_TOKEN ?? "";
}

export async function fetchCachedSummary(): Promise<DailySummary | null> {
  const base = proxyUrl();
  const url = base ? `${base}/api/summary` : "/api/summary";

  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch summary: ${res.status}`);

  return (await res.json()) as DailySummary;
}

export async function generateDailySummary(feeds: string[]): Promise<DailySummary> {
  const base = proxyUrl();
  const url = base ? `${base}/api/summary` : "/api/summary";
  const token = authToken();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ feeds }),
  });

  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  return (await res.json()) as DailySummary;
}
