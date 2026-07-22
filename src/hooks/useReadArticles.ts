import { useState, useCallback } from "react";

const STORAGE_KEY = "feedpop-read";

function loadReadSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set<string>(parsed);
  } catch {
    return new Set();
  }
}

function saveReadSet(ids: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function useReadArticles() {
  const [readIds, setReadIds] = useState<Set<string>>(loadReadSet);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveReadSet(next);
      return next;
    });
  }, []);

  const unreadCount = useCallback(
    (total: number) => total - readIds.size,
    [readIds],
  );

  return { readIds, markRead, unreadCount };
}
