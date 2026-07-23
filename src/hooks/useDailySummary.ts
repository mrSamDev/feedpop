import { useState, useEffect, useCallback } from "react";
import type { DailySummary } from "../types";
import { fetchCachedSummary, generateDailySummary } from "../api/summaryApi";

const STORAGE_KEY = "feedpop-daily-summary";

function loadCached(): DailySummary | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailySummary;
    // Only use cache if it's from today
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.date !== today) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCached(summary: DailySummary) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(summary));
  } catch {
    // localStorage full — ignore
  }
}

export function useDailySummary() {
  const [summary, setSummary] = useState<DailySummary | null>(loadCached);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try fetching cached summary from server on mount
  useEffect(() => {
    if (summary) return; // Already have today's summary
    fetchCachedSummary()
      .then((s) => {
        if (s) {
          setSummary(s);
          saveCached(s);
        }
      })
      .catch(() => {
        // Server not available or no summary — fine
      });
  }, [summary]);

  const generate = useCallback(async (feeds: string[]) => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateDailySummary(feeds);
      setSummary(result);
      saveCached(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate summary";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    setSummary(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { summary, isGenerating, error, generate, dismiss };
}
