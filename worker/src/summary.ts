const FEED_TIMEOUT_MS = 10000;
const MAX_ARTICLES = 50;

interface FeedItem {
  title: string;
  description: string;
}

interface SummaryResult {
  date: string;
  summary: string;
  topics: string[];
  generatedAt: number;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildPrompt(feeds: FeedItem[]): string {
  const items = feeds
    .slice(0, MAX_ARTICLES)
    .map((f) => `- ${f.title}${f.description ? `: ${f.description.slice(0, 200)}` : ""}`)
    .join("\n");

  return `You are FeedPop, a playful RSS reader assistant. Summarize today's articles in 3-4 sentences. Keep it light and fun. Then list 3-5 key topics as short phrases.

Articles:
${items}

Respond in JSON: { "summary": "...", "topics": ["...", "..."] }`;
}

async function fetchFeed(
  url: string,
  fetchImpl: typeof fetch,
): Promise<FeedItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
    const res = await fetchImpl(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const xml = await res.text();

    // Simple RSS/Atom parser — extract titles + descriptions
    const items: FeedItem[] = [];
    const titleRegex = /<title[^>]*>([^<]+)<\/title>/gi;
    const descRegex = /<description[^>]*>([^<]+)<\/description>/gi;
    const contentRegex = /<content[^>]*>([^<]+)<\/content>/gi;

    const titles: string[] = [];
    let match;
    while ((match = titleRegex.exec(xml)) !== null) {
      // Skip feed-level title (first <title> is usually the feed name)
      if (titles.length === 0) {
        titles.push(match[1]);
        continue;
      }
      titles.push(match[1]);
    }

    const descriptions: string[] = [];
    while ((match = descRegex.exec(xml)) !== null) {
      descriptions.push(match[1]);
    }
    while ((match = contentRegex.exec(xml)) !== null) {
      if (descriptions.length < titles.length - 1) {
        descriptions.push(match[1]);
      }
    }

    // Pair titles with descriptions (skip feed-level title)
    for (let i = 1; i < titles.length; i++) {
      items.push({
        title: titles[i],
        description: descriptions[i - 1] ?? "",
      });
    }

    return items;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to fetch feed ${url}: ${message}`);
    return [];
  }
}

export async function generateSummary(
  feedUrls: string[],
  openAiKey: string,
  kv: KVNamespace,
  fetchImpl: typeof fetch = fetch,
): Promise<SummaryResult> {
  const date = todayKey();

  // Fetch all feeds in parallel
  const results = await Promise.allSettled(
    feedUrls.map((url) => fetchFeed(url, fetchImpl)),
  );
  const articles = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  if (articles.length === 0) {
    throw new Error("No articles found in feeds");
  }

  // Call OpenAI
  const prompt = buildPrompt(articles);
  const body = JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a playful RSS assistant. Respond only with valid JSON." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  const res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`,
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  const cleaned = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  const parsed = JSON.parse(cleaned) as { summary: string; topics: string[] };

  const result: SummaryResult = {
    date,
    summary: parsed.summary,
    topics: parsed.topics ?? [],
    generatedAt: Date.now(),
  };

  // Delete old key, write new one
  const oldKey = await kv.list({ prefix: "summary-" });
  for (const key of oldKey.keys) {
    await kv.delete(key.name);
  }
  await kv.put(`summary-${date}`, JSON.stringify(result));

  return result;
}

export async function getCachedSummary(
  kv: KVNamespace,
): Promise<SummaryResult | null> {
  const date = todayKey();
  const raw = await kv.get(`summary-${date}`);
  if (!raw) return null;
  return JSON.parse(raw) as SummaryResult;
}
