import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "feedpop-read";

function loadReadSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set<string>(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to parse stored read articles: ${message}`);
    return new Set();
  }
}

function saveReadSet(ids: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function useReadArticles() {
  const [readIds, setReadIds] = useState<Set<string>>(loadReadSet);

  // Persist to localStorage whenever readIds changes
  useEffect(() => {
    saveReadSet(readIds);
  }, [readIds]);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  function unreadCount(articleIds: string[]): number {
    return articleIds.filter((id) => !readIds.has(id)).length;
  }

  return { readIds, markRead, unreadCount };
}