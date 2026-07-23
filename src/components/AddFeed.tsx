import { useState, type FormEvent } from "react";
import { normalizeUrl, isValidFeedUrl } from "../lib/url";

interface AddFeedProps {
  isAdding: boolean;
  onAdd: (url: string, title: string) => void;
}

export function AddFeed({ isAdding, onAdd }: AddFeedProps) {
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const url = normalizeUrl(input);
    if (!isValidFeedUrl(url)) return;
    onAdd(url, title.trim());
    setInput("");
    setTitle("");
  }

  return (
    <form onSubmit={handleSubmit} className="panel fade-in flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste an RSS or Atom feed URL…"
        aria-label="Add feed URL"
        className="text-input flex-1"
      />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title for sidebar (optional)"
        aria-label="Custom feed title"
        className="text-input sm:w-48"
      />
      <button
        type="submit"
        disabled={isAdding}
        aria-label="Add feed"
        className="btn btn-secondary px-4 py-2 sm:shrink-0"
      >
        {isAdding ? "…" : "Add feed"}
      </button>
    </form>
  );
}