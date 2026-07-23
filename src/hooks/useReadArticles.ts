import { useState, useCallback, useEffect } from "react";

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

  function unreadCount(total: number) {
    return total - readIds.size;
  }

  return { readIds, markRead, unreadCount };
}
